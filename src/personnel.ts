import { CompletedQuestionnaire, ParticipantResponse, Questionnaire } from './types';

const RESPONSES_SHEET_NAME = 'Form Responses 1';

export function onOpen() {
	const ui = SpreadsheetApp.getUi();
	ui.createMenu('V9VSoft')
		.addItem('Process responses', 'processResponses')
		.addToUi();
}

export function processResponses() {
	const participantResponses = parseParticipantResponses();
	if (!participantResponses) {
		return;
	}

	const companies = participantResponses.map(r => r.company).filter(keepUnique);
	initCompanySheets(companies);
	companies.forEach(company => renderResults(company, participantResponses));
}

function renderResults(company: string, participantResponses: ParticipantResponse[]) {
	const companyParticipantQuestionnaires = participantResponses
		.filter(r => r.company === company)
		.map(r => r.questionnaires);

	const questionnaires = [
		getQuestionnaire0()
	];

	questionnaires.forEach(q => renderQuestionnaire(company, q, companyParticipantQuestionnaires))
}

function renderQuestionnaire(
	company: string,
	questionnaire: Questionnaire,
	participantResponses: CompletedQuestionnaire[][],
) {
	const rows = [] as (string | number)[][];
	// Build Header
	rows.push([questionnaire.name, ...questionnaire.scales.map(s => s.name)]);

	// Build Participant Rows
	participantResponses.forEach((participantQuestionnaires, i) => {
		rows.push([
			`${company} ${i + 1}`,
			...questionnaire.scales.map(scale =>
				scale.questions
					.map(questionIndex =>
						participantQuestionnaires[questionnaire.index].responses[questionIndex])
					.reduce((sum, value) => sum + value, 0)
			),
		]);
	});

	// Build Company Average Row
	const averageValues = rows.reduce(
		(sums, row, i) => i === 0 ? [] : sums.length
			? sums.map((s, i) => Number(s) + Number(row[i]))
			: row,
		[]
	).map(v => Number(v) / participantResponses.length);
	averageValues.shift();
	rows.push([`${company} AVG`, ...averageValues]);

	// Render built rows
	const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	const companySheet = spreadsheet.getSheetByName(company);
	const startRow = 1 + (participantResponses.length + 3) * questionnaire.index;
	companySheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}

function initCompanySheets(companies: string[]) {
	const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	const sheetNames = spreadsheet.getSheets().map(s => s.getName());
	for (const company of companies) {
		if (!company) {
			continue;
		}

		// Create sheet if not yet created
		if (!sheetNames.includes(company)) {
			const newSheet = spreadsheet.insertSheet();
			newSheet.setName(company);
		} else {
			const companySheet = spreadsheet.getSheetByName(company);
			companySheet.clear();
		}
	}
}

function parseParticipantResponses(): ParticipantResponse[] {
	const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	const sheetResponses = spreadsheet?.getSheetByName(RESPONSES_SHEET_NAME);
	if (!sheetResponses) {
		return;
	}

	const participantResponses = [] as ParticipantResponse[];

	let nRow = 2;
	let range = sheetResponses.getRange(`${nRow}:${nRow}`).getValues();
	while (range[0][0]) {
		participantResponses.push(parseParticipantResponse(range[0]));

		nRow++;
		range = sheetResponses.getRange(`${nRow}:${nRow}`).getValues();
	}

	return participantResponses;
}

function parseParticipantResponse(row: any[]): ParticipantResponse {
	const COL_COMPANY = 1;

	const q0 = getQuestionnaire0();
	const COL_Q0_START = 2;
	const COL_Q0_FINISH = 45;

	const participantResponse: ParticipantResponse = {
		company: row[COL_COMPANY],
		questionnaires: [
			{
				questionnaireName: q0.name,
				responses: row
					.filter((_, i) => i >= COL_Q0_START && i <= COL_Q0_FINISH)
					.reduce((responses, value, i) => {
						responses[i + 1] = q0.questions.find(q => q.index === i + 1).options[value];
						return responses;
					}, {}),
			},
		],
	};

	return participantResponse;
}

function getQuestionnaire0(): Questionnaire {
	const questionnaire = {
		name: 'Опросник',
		index: 0,
		scales: [
			{ name: 'Руководитель.Видение', questions: [12, 1, 23, 34] },
			{ name: 'Руководитель.Результативность', questions: [2, 13, 24, 35] },
			{ name: 'Руководитель.Системность', questions: [3, 25, 36, 14] },
			{ name: 'Руководитель.Квалификация', questions: [4, 37, 15, 26] },
			{ name: 'Руководитель.Ценности', questions: [5, 38, 27, 16] },
			{ name: 'Стратегия.Четкость', questions: [6, 17, 39, 28] },
			{ name: 'Организация.Полномочия-обязанности', questions: [7, 29, 40, 18] },
			{ name: 'Климат.Доверие', questions: [8, 19, 41, 30] },
			{ name: 'Климат.Настроение', questions: [9, 31, 42, 20] },
			{ name: 'Итоги.Достижение', questions: [10, 43, 32, 21] },
			{ name: 'Итоги.Удовлетворенность', questions: [11, 33, 22, 44] },
		]
	};

	const options = {
		'Нет, это совсем не так': 1,
		'Скорее нет, чем да': 2,
		'Затрудняюсь ответить': 3,
		'Скорее да, чем нет': 4,
		'Да, совершенно верно': 5,
	};

	const optionsRev = {
		'Нет, это совсем не так': 5,
		'Скорее нет, чем да': 4,
		'Затрудняюсь ответить': 3,
		'Скорее да, чем нет': 2,
		'Да, совершенно верно': 1,
	};

	const reversed = [34, 35, 14, 26, 16, 28, 18, 30, 20, 21, 44];

	return {
		...questionnaire,
		questions: Array.from({ length: 44 }).map((_, i) => ({
			index: i + 1,
			title: '',
			options: reversed.includes(i + 1) ? optionsRev : options
		}))
	};
}

function keepUnique(value, index, self) {
	return self.indexOf(value) === index;
}
