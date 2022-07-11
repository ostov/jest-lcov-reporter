// @ts-check
import { th, tr, td, table, tbody, a, b, span, fragment } from "./html"

// Tabulate the lcov data in a HTML table.
export function tabulate(lcov, options) {
	const head = tr(
		th("File"),
		// th("Branches"),
		th("Lines (%)"),
		th("Funcs (%)"),
		th("Uncovered Lines"),
	)

	const folders = {}
	for (const file of lcov) {
		// if (!options.files.some(f => {
		// 	return file.file.endsWith(f) || f.endsWith(file.file);
		// })) {
		// 	return;
		// }
		const parts = file.file.replace(options.prefix, "").split("/")
		const folder = parts.slice(0, -1).join("/")
		folders[folder] = folders[folder] || []
		folders[folder].push(file)
	}

	const rows = Object.keys(folders)
		.sort()
		.reduce(
			(acc, key) => {
				const files = [...folders[key]].sort((a,b)=>a.file.localeCompare(b.file)).map(file => toRow(file, key !== "", options)).filter(e => e !== null);
				return files.length ? [
					...acc,
					toFolder(key, options),
					files
					,
				] : [...acc];
			},
			[],
		)

	return table(tbody(head, ...rows))
}

function smartTrim(rawPath) {
	const path = rawPath.replace('src/', '');
	const parts = path.split("/");
	const keywords = ['components'];
	const newParts = parts.map((p)=>{
		return keywords.includes(p) ? '...' : p.split('.').pop();
	});
	const newLine = newParts.join('/');
	if (newLine.length <= 96) {
		return newLine;
	} else {
		return `${newLine.slice(0, 96)}...`;
	}
}


function toFolder(path) {
	if (path === "") {
		return ""
	}

	return tr(td({ colspan: 4 }, `<b title="${path}">${smartTrim(path)}</b>`))
}

function toRow(file, indent, options) {
	let branches = percentage(file.branches, options);
	let functions = percentage(file.functions, options);
	let lines = percentage(file.lines, options);

	const allOk = branches === '' && functions === '' && lines === '';

	if (allOk) {
		return null;
	}

	return tr(
		td(filename(file, indent, options)),
		// td(branches),
		td(lines),
		td(functions),
		td(uncovered(file, options)),
	)
}

function filename(file, indent, options) {
	const relative = file.file.replace(options.prefix, "")
	const parts = relative.split("/")
	const last = parts[parts.length - 1]
	const space = indent ? "&nbsp; &nbsp;" : ""
	return fragment(space, last)
}

function percentage(item) {
	if (!item) {
		return "N/A"
	}

	const value = item.found === 0 ? 100 : (item.hit / item.found) * 100
	const rounded = value.toFixed(2).replace(/\.0*$/, "")

	const tag = value === 100 ? fragment : b

	if (rounded === '0' || rounded === '100') {
		return "";
	}

	return tag(`${rounded}`)
}

function uncovered(file, options) {
	const branches = (file.branches ? file.branches.details : [])
		.filter(branch => branch.taken === 0)
		.map(branch => branch.line)

	const lines = (file.lines ? file.lines.details : [])
		.filter(line => line.hit === 0)
		.map(line => line.line)
	const allLines = [...branches, ...lines]
	let all = [...branches, ...lines].sort()
	if (all.length > 3) {
		const lastFour = all.slice(Math.max(all.length - 4, 0))

		all = [...lastFour, '...']
	}
	return all
		.map(function(line) {
			const relative = file.file.replace(options.prefix, "")
			const path = `${line}`
			return path;
		})
		.join(", ")
}
