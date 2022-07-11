import { promises as fs } from "fs"
import core from "@actions/core"
import sh from 'run-sh';
import { getOctokit, context } from "@actions/github"

import { parse } from "./lcov"
import { commentIdentifier, diff } from "./comment"

async function main() {
	const token = core.getInput("github-token")
	const name = core.getInput("name")
	const lcovFile = core.getInput("lcov-file") || "./coverage/lcov.info"
	const baseFile = core.getInput("lcov-base")
	const updateComment = core.getBooleanInput("update-comment")

	const raw = await fs.readFile(lcovFile, "utf-8").catch(err => null)
	if (!raw) {
		console.log(`No coverage report found at '${lcovFile}', exiting...`)
		return
	}

	const baseRaw =
		baseFile && (await fs.readFile(baseFile, "utf-8").catch(err => null))
	if (baseFile && !baseRaw) {
		console.log(`No coverage report found at '${baseFile}', ignoring...`)
	}

	const isPullRequest = Boolean(context.payload.pull_request)
	if (!isPullRequest) {
		console.log("Not a pull request, skipping...")
		return
	}

	const head = context.payload.pull_request.head.ref;
	const base = context.payload.pull_request.base.ref;

	
	let changed = [];

	try {
		const res = await sh(`git diff --name-only ${head} ${base}`);
		changed = res.stdout.split("\n");
	} catch(e) {
		// ignore
	}

	const options = {
		name,
		files: changed,
		repository: context.payload.repository.full_name,
		commit: context.payload.pull_request.head.sha,
		prefix: `${process.env.GITHUB_WORKSPACE}/`,
		head,
		base,
		workflowName: process.env.GITHUB_WORKFLOW,
	}

	const lcov = await parse(raw)
	const baselcov = baseRaw && (await parse(baseRaw))
	const body = await diff(lcov, baselcov, options)
	const githubClient = new getOctokit(token)

	const createGitHubComment = () =>
		githubClient.rest.issues.createComment({
			repo: context.repo.repo,
			owner: context.repo.owner,
			issue_number: context.payload.pull_request.number,
			body,
		})

	const updateGitHubComment = commentId =>
		githubClient.rest.issues.updateComment({
			repo: context.repo.repo,
			owner: context.repo.owner,
			comment_id: commentId,
			body,
		})

	if (updateComment) {
		const issueComments = await githubClient.rest.issues.listComments({
			repo: context.repo.repo,
			owner: context.repo.owner,
			issue_number: context.payload.pull_request.number,
		})

		const existingComment = issueComments.data.find(comment =>
			comment.body.includes(commentIdentifier(options.workflowName)),
		)

		if (existingComment) {
			await updateGitHubComment(existingComment.id)
			return
		}
	}

	await createGitHubComment()
}

export default main().catch(function(err) {
	console.log(err)
	core.setFailed(err.message)
})
