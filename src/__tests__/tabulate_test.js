import { tabulate } from "../tabulate"
import { th, tr, td, table, tbody, b, span, fragment } from "../html"

test("tabulate should generate a correct table", function() {
	const files = [
		'/files/project/index.js',
		'/files/project/src/foo.js',
		'/files/project/src/bar/baz.js'
	]
	const data = [
		{
			file: "/files/project/index.js",
			functions: {
				found: 0,
				hit: 0,
				details: [],
			},
		},
		{
			file: "/files/project/src/foo.js",
			lines: {
				found: 23,
				hit: 21,
				details: [
					{
						line: 20,
						hit: 3,
					},
					{
						line: 21,
						hit: 3,
					},
					{
						line: 22,
						hit: 3,
					},
				],
			},
			functions: {
				hit: 2,
				found: 3,
				details: [
					{
						name: "foo",
						line: 19,
					},
					{
						name: "bar",
						line: 33,
					},
					{
						name: "baz",
						line: 54,
					},
				],
			},
			branches: {
				hit: 3,
				found: 3,
				details: [
					{
						line: 21,
						block: 0,
						branch: 0,
						taken: 1,
					},
					{
						line: 21,
						block: 0,
						branch: 1,
						taken: 2,
					},
					{
						line: 37,
						block: 1,
						branch: 0,
						taken: 0,
					},
				],
			},
		},
		{
			file: "/files/project/src/bar/baz.js",
			lines: {
				found: 10,
				hit: 5,
				details: [
					{
						line: 22,
						hit: 0,
					},
					{
						line: 31,
						hit: 0,
					},
					{
						line: 32,
						hit: 0,
					},
					{
						line: 33,
						hit: 0,
					},
					{
						line: 34,
						hit: 0,
					},
				],
			},
			functions: {
				hit: 4,
				found: 6,
				details: [
					{
						name: "foo",
						line: 19,
					},
					{
						name: "bar",
						line: 33,
					},
					{
						name: "baz",
						line: 54,
					},
					{
						name: "foobar",
						line: 62,
					},
				],
			},
		},
	]

	const options = {
		repository: "example/foo",
		commit: "2e15bee6fe0df5003389aa5ec894ec0fea2d874a",
		prefix: "/files/project/",
		files,
		minCoverage: 70,
	}

	const html = table(
		tbody(
			tr(
				th("File"),
				th("Lines (%)"),
				th("Funcs (%)"),
				th("Uncovered Lines"),
			),
			tr(
				td(
						"index.js",
				),
				td("N/A"),
				td(""),
				td(),
			),
			tr(td({ colspan: 4 },`<b title="src">src</b>`)),
			tr(
				td(
					"&nbsp; &nbsp;",
					"foo.js"
				),
				td("91.30"),
				td(b("66.67")),
				td(
					"37"
				),
			),
			tr(td({ colspan: 4 },`<b title="src/bar">bar</b>`)),
			tr(
				td(
					"🔴","&nbsp; &nbsp;",
					"baz.js", "&nbsp;⬆️&nbsp;20.00%"
				),
				td(b("50")),
				td(b("66.67")),
				td(
					
						"31",
					", ",
					
						"32",
					
					", ",
						"33",
					
					", ",
						"34", ",", " ..."
				),
			),
		),
	)
	expect(tabulate(data, options)).toBe(html)
})
