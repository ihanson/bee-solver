document.addEventListener("DOMContentLoaded", () => {
	addEntryForm();

	function addEntryForm() {
		const letters = textbox(
			{
				pattern: "[A-Z]{7}",
				title: "Enter 7 letters",
				required: "",
			},
			(value) => normalizeLetters(value),
		);
		const centerLetter = textbox(
			{
				pattern: "[A-Z]",
				title: "Enter one of the letters",
				required: "",
				maxLength: 1,
				classes: ["centerLetter"]
			},
			(value) => normalizeLetters(value),
			(letter) => !letters.value.includes(letter) ? "Invalid letter" : null,
		);
		const form = el("form", {
			events: {
				submit: async (event) => {
					event.preventDefault();
					const container = document.getElementById("result");
					container.innerHTML = "";
					container.appendChild(
						await solutionElement([...letters.value], centerLetter.value)
					);
				}
			}
		}, [
			el("div", {classes: ["fieldRow"]}, [
				labelInput("Letters", letters, {classes: ["lettersLabel"]}),
				labelInput("Center", centerLetter),
			]),
			el("button", {
				events: {
					submit: () => form.submit()
				}
			}, [t("Solve")]),
		]);
		document.getElementById("entry").appendChild(form);
		letters.focus();
	}

	async function solutionElement(letters, centerLetter) {
		const words = await solution(letters, centerLetter);
		return el("div", {classes: ["solution"]}, [
			el("div", {}, [t(`${words.length.toLocaleString()} words found`)]),
			el(
				"ul",
				{},
				words.map((word) => el("li", {
					classes: [isPangram(letters, word) ? "pangram" : null]
				}, [
					el("a", {
						href: link(word),
					}, [t(word.toLocaleLowerCase())])
				])),
			),
		]);
	}

	async function solution(letters, centerLetter) {
		return (
			(await allWords())
				.filter((word) => canMakeWord(letters, centerLetter, word))
				.sort(multiSort(
					(word1, word2) => score(letters, word2) - score(letters, word1),
					(word1, word2) => word1.localeCompare(word2)
				))
		);
	}

	function link(word) {
		return `https://www.collinsdictionary.com/dictionary/english/${
			encodeURIComponent(word.toLocaleLowerCase())
		}`;
	}

	async function allWords() {
		return (await (await fetch("words.txt")).text()).split("\n");
	}

	function canMakeWord(letters, centerLetter, word) {
		const splitWord = [...word];
		return (
			splitWord.includes(centerLetter)
			&& splitWord.every((letter) => letters.includes(letter))
		);
	}

	function isPangram(letters, word) {
		const splitWord = [...word];
		return letters.every((letter) => splitWord.includes(letter));
	}

	function normalizeLetters(letters) {
		return (
			[
			...letters
				.toLocaleUpperCase()
				.replace(/[^A-Z]/g, "")
			].filter((letter, i, arr) => arr.indexOf(letter) === i)
				.sort((letter1, letter2) => letter1.localeCompare(letter2))
				.join("")
		);
	}
	
	function multiSort(...orders) {
		return (value1, value2) => {
			for (order of orders) {
				const result = order(value1, value2);
				if (result !== 0) {
					return result;
				}
			}
			return 0;
		}
	}

	function score(letters, word) {
		return word.length - 3 + (isPangram(letters, word) ? 7 : 0);
	}

	//#region DOM helper functions
	function textbox({events = {}, ...attrs} = {}, normalize = (v) => v, validate = () => {}) {
		const handle = (event, handler = () => {}) => {
			event.target.setCustomValidity(validate(event.target.value) ?? "");
			handler.call(event.target, event);
		};
		return el("input", {
			...attrs,
			events: {
				...events,
				blur: (event) => {
					event.target.value = normalize(event.target.value);
					handle(event, events.blur);
				},
				keydown: (event) => {
					if (event.key === "Enter") {
						event.target.value = normalize(event.target.value);
					}
					handle(event, events.keydown);
				}
			}
		});
	}

	function el(
		tag,
		{
			classes = [],
			events = {},
			...attrs
		} = {},
		childNodes = [],
	) {
		const element = document.createElement(tag);
		for (const [attr, value] of Object.entries(attrs)) {
			element.setAttribute(attr, value);
		}
		for (const className of classes.filter((className) => className)) {
			element.classList.add(className);
		}
		for (const [event, handler] of Object.entries(events)) {
			element.addEventListener(event, handler);
		}
		for (const child of childNodes) {
			element.appendChild(child);
		}
		return element;
	}
	
	function t(text) {
		return document.createTextNode(text);
	}

	function labelInput(text, input, {classes = [], ...attrs} = {}) {
		return el(
			"label",
			{
				...attrs,
				classes: [...classes, "labelInput"],
			},
			[t(text), input]
		);
	}
	//#endregion
});