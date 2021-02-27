import { ParticipantResponse, Questionnaire } from "./types";

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

	const companies = [...new Set(participantResponses.map(r => r.company))];
	initCompanySheets(companies);
	companies.forEach(company => renderResults(company, participantResponses));
}

function renderResults(company: string, participantResponses: ParticipantResponse[]) {
	const companyParticipantQuestionnaires = participantResponses
		.filter(r => r.company === company)
		.map(r => r.questionnaires);

	const data = [] as (string | number)[][];

	const q1 = getQuestionnaire1();
	data.push(['', ...q1.scales.map(s => s.name)]);
	companyParticipantQuestionnaires.forEach((participantQuestionnaires, i) => {
		data.push([
			`${company} ${i + 1}`,
			...q1.scales.map(scale =>
				scale.questions
					.map(qIndex => participantQuestionnaires[0].responses[qIndex])
					.reduce((sum, value) => sum + value, 0)
			),
		]);
	});

	const averageValues = data.reduce(
		(sums, row, i) => i === 0 ? [] : sums.length
			? sums.map((s, i) => Number(s) + Number(row[i]))
			: row,
		[]
	).map(v => Number(v) / companyParticipantQuestionnaires.length);
	averageValues.shift();
	data.push([`${company} AVG`, ...averageValues]);

	const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	const companySheet = spreadsheet.getSheetByName(company);
	companySheet.getRange(1, 1, data.length, data[0].length).setValues(data);
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
	const COL_Q1_START = 2;
	const COL_Q2_FINISH = 113;

	const q1 = getQuestionnaire1();

	const participantResponse: ParticipantResponse = {
		company: row[COL_COMPANY],
		questionnaires: [
			{
				questionnaireName: q1.name,
				responses: row
					.filter((r, i) => i >= COL_Q1_START && i <= COL_Q2_FINISH)
					.reduce((responses, value, i) => {
						responses[i + 1] = q1.questions.find(q => q.index === i + 1).options[value];
						return responses;
					}, {}),
			},
		],
	};

	return participantResponse;
}

function getQuestionnaire1(): Questionnaire {
	const questionnaire = {
		name: 'Опросник',
		questions: [
			{ index: 1, title: 'У CEO нашей компании есть четкий план, который приведет нас к успеху' },
			{ index: 2, title: 'Когда у нашей команды возникают сложности,  СEO - тот человек, который продолжает двигать команду к цели' },
			{ index: 3, title: 'Наш лидер имеет успешный опыт работы в большой компании' },
			{ index: 4, title: 'Состав нашей управленческой команды меняется очень редко' },
			{ index: 5, title: 'Каждый член нашей управленческой команды имеет свою специализацию' },
			{ index: 6, title: 'Мы почти никогда не привлекаем внешних экспертов для выполнения задач' },
			{ index: 7, title: 'Все члены нашей управленческой команды отличаются инициативностью' },
			{ index: 8, title: 'Я знаю поставленные перед компанией стратегические цели' },
			{ index: 9, title: 'Я полностью согласен с поставленными перед компанией стратегическими целями' },
			{ index: 10, title: 'В компании есть подробная, зафиксированная организационная структура' },
			{ index: 11, title: 'Я не обязан согласовывать увольнение сотрудника из своего подразделения' },
			{ index: 12, title: 'У меня и моих подчиненных есть четкие критерии эффективности выполнения задач' },
			{ index: 13, title: 'И материальная, и нематериальная мотивация полностью меня устраивают' },
			{ index: 14, title: 'Я бы хотел проработать в этой команде еще много лет' },
			{ index: 15, title: 'На наших совещаниях можно задавать любые, даже «глупые» вопросы, и высказывать необычные идеи' },
			{ index: 16, title: 'В управленческой команде есть негласные правила, которые все соблюдают' },
			{ index: 17, title: 'Все члены нашей команды довольно приятные люди' },
			{ index: 18, title: 'Наша команда с оптимизмом смотрит в будущее' },
			{ index: 19, title: 'Я всегда заранее знаю о том, какие вопросы и задачи мы будем обсуждать на совещании' },
			{ index: 20, title: 'Члены управленческой команды готовы поступиться своими интересами ради общего результата' },
			{ index: 21, title: 'Процедура принятия управленческих решений прозрачна и понятна' },
			{ index: 22, title: 'Решения в нашей управленческой команде принимаются консенсусом' },
			{ index: 23, title: 'Корпоративная информация в нашей компании регулярно обновляется' },
			{ index: 24, title: 'У меня есть свободный доступ к циркулирующей в компании информации' },
			{ index: 25, title: 'Обратная связь поступает мне вовремя' },
			{ index: 26, title: 'Я регулярно учусь и осваиваю новые навыки' },
			{ index: 27, title: 'Все запланированные цели достигаются нашей командой' },
			{ index: 28, title: 'Я удовлетворен своими результатами' },
			{ index: 29, title: 'Наш CEO «горит» идеей построения крупной компании' },
			{ index: 30, title: 'В ситуациях неопределенности CEO берет на себя ответственность и принимает решения, продвигающие нашу команду к цели' },
			{ index: 31, title: 'Благодаря CEO в нашей компании все работает «как часы»' },
			{ index: 32, title: 'Когда я начал заполнять этот тест, я сразу понял, о какой управленческой команде идет речь и кто в нее входит' },
			{ index: 33, title: 'Можно сказать, что наша управленческая команда полностью укомплектована' },
			{ index: 34, title: 'У всех членов управленческой команды есть большой опыт той работы, которую они делают сейчас' },
			{ index: 35, title: 'В нашей управленческой команде нет «пассажиров»' },
			{ index: 36, title: 'Каждый из нас знает, как его рабочие задачи влияют на ключевые цели, стоящие перед организацией' },
			{ index: 37, title: 'Я уверен, что остальные члены управленческой команды полностью понимают цели, стоящие перед компанией' },
			{ index: 38, title: 'Я знаю, кто из руководителей за что отвечает' },
			{ index: 39, title: 'В своей зоне ответственности я сам принимаю все решения, ни с кем не советуясь' },
			{ index: 40, title: 'Наш CEO регулярно контролирует своих подчиненных' },
			{ index: 41, title: 'Мои коллеги не жалуются на свою мотивацию' },
			{ index: 42, title: 'Я полностью доверяю мнению моих коллег по вопросам, касающимся их компетенции' },
			{ index: 43, title: 'Можно сказать, что в нашей команде достаточно безопасная и комфортная атмосфера' },
			{ index: 44, title: 'В нашей управленческой команде допустимо быть «не таким, как все»' },
			{ index: 45, title: 'Даже, если в команде возникает спор, взаимная симпатия не позволяет ему перейти в конфликт' },
			{ index: 46, title: 'Я всегда с удовольствием работаю' },
			{ index: 47, title: 'Некоторые члены нашей команды до последнего придерживают информацию, даже если она необходима для решения проблемы' },
			{ index: 48, title: 'Если будет необходимо, я буду работать до глубокой ночи и по выходным' },
			{ index: 49, title: 'Порой мне совершенно непонятно, по какой причине принимается то или иное управленческое решение' },
			{ index: 50, title: 'В нашей управленческой команде принято обсуждать решение до тех пор, пока все с ним не согласятся' },
			{ index: 51, title: 'У нас есть полный массив корпоративной информации: о ситуации, планах, возможностях, ресурсах и инструментах, которыми владеет команда' },
			{ index: 52, title: 'Мои коллеги всегда охотно делятся со мной рабочей информацией' },
			{ index: 53, title: 'Мои коллеги умеют цивилизованно и деликатно предоставлять обратную связь' },
			{ index: 54, title: 'Наша компания предпочитает не тратить время и деньги на обучение сотрудников' },
			{ index: 55, title: 'Для меня важно сдавать свою работу вовремя' },
			{ index: 56, title: 'Я доволен тем, как работают мои коллеги из управленческой команды' },
			{ index: 57, title: 'На мой взгляд, планы нашего CEO недостаточно амбициозны и масштабны' },
			{ index: 58, title: 'Фраза «человек, у которого слова не расходятся с делом» точно отражает нашего CEO' },
			{ index: 59, title: 'Наш CEO способен эффективно распределять обязанности' },
			{ index: 60, title: 'Я не уверен, что все члены управленческой команды хорошо знают друг друга' },
			{ index: 61, title: 'Я считаю, что каждый член нашей управленческой команды, дополняет команду своими индивидуальными навыками' },
			{ index: 62, title: 'Все члены управленческой команды являются экспертами в своих областях' },
			{ index: 63, title: 'В нашей команде есть некоторые участники, которые стараются переложить с себя ответственность в сложных ситуациях' },
			{ index: 64, title: 'Мы регулярно обсуждаем, как продвигаемся к ключевым целям' },
			{ index: 65, title: 'На этапе планирования мое мнение учитывается' },
			{ index: 66, title: 'У нас иногда возникают ситуации, когда непонятно кто должен нести ответственность и решать возникшую проблему' },
			{ index: 67, title: 'Процесс согласования в нашей компании – это головная боль и уйма сил и времени' },
			{ index: 68, title: 'Мы регулярно проводим встречи для понимания того, на каком этапе реализации своих целей находится каждый участник команды' },
			{ index: 69, title: 'В нашей компании считается нормальным обсуждать систему мотивации' },
			{ index: 70, title: 'Если возникает какая-то проблема, каждый старается найти виноватого' },
			{ index: 71, title: 'Свои идеи я предпочитаю держать при себе, если они не совпадают с мнением большинства участников команды' },
			{ index: 72, title: 'Я чувствую, что некоторые члены команды относятся ко мне с недостаточным уважением' },
			{ index: 73, title: 'Члены управленческой команды испытывают симпатию друг к другу' },
			{ index: 74, title: 'Как правило, общаясь с нашим CEO, я получаю настоящий заряд позитива и оптимизма' },
			{ index: 75, title: 'Я стараюсь максимально собрать всю необходимую информацию перед совещанием' },
			{ index: 76, title: 'Если нужно для общего результата - я окажу помощь коллеге, даже если это будет противоречить моим интересам' },
			{ index: 77, title: 'С большой долей вероятности можно предсказать будущее решение СEO' },
			{ index: 78, title: 'Большинство решений в нашей управленческой команде принимаются СEO' },
			{ index: 79, title: 'Часть корпоративных документов в нашей компании, словно специально, написана так, чтобы никто ничего не понял' },
			{ index: 80, title: 'Я всегда делюсь своими идеями с коллегами, если они об этом просят' },
			{ index: 81, title: 'Мне очень сложно получить искреннюю обратную связь от коллег' },
			{ index: 82, title: 'Я постоянно слежу за инновациями в нашей сфере' },
			{ index: 83, title: 'Перенос дедлайнов – это норма в нашей компании' },
			{ index: 84, title: 'Я не доволен результатами, которых добилась наша компания' },
			{ index: 85, title: 'СEO нашей компании делится с нами видением от том, какой он хочет видеть компанию в будущем' },
			{ index: 86, title: 'Иногда наш СEO сам не понимает, к какому результату он хочет привести нашу компанию' },
			{ index: 87, title: 'Способность структурировать процессы – не самая сильная сторона нашего СEO' },
			{ index: 88, title: 'С моей точки зрения, в нашей управленческой команде ровно столько людей, сколько необходимо для ее эффективной работы' },
			{ index: 89, title: 'Если бы я был СEO, я бы изменил текущий состав нашей управленческой команды' },
			{ index: 90, title: 'Иногда, некоторые члены управленческой команды не могут ответить на вопрос, явно относящийся к их зоне компетентности' },
			{ index: 91, title: 'Большинство моих принципов и ценностей относительно работы совпадают с другими членами управленческой команды' },
			{ index: 92, title: 'Иногда мне кажется, что мои задачи никак не связаны со стратегическими целями компании, а то и противоречат им' },
			{ index: 93, title: 'Цели нашей компании, как правило, слишком амбициозны и, мне кажется, все понимают, что нам их не достичь в полной мере' },
			{ index: 94, title: 'Когда у меня возникает какой-то вопрос не из моей зоны компетентности, я всегда знаю, к кому именно надо с ним обратиться' },
			{ index: 95, title: 'У меня не бывает ситуаций, когда я чувствую, что не могу решить задачу по причине отсутствия необходимых полномочий' },
			{ index: 96, title: 'Система отчетности – это не про нашу компанию' },
			{ index: 97, title: 'Я считаю, что за ту работу, которую я делаю, я мог бы получать большее вознаграждение' },
			{ index: 98, title: 'Про нашу команду можно сказать, что мы все в «одной лодке»' },
			{ index: 99, title: 'В нашей команде люди заняты работой, а не «обороной»' },
			{ index: 100, title: 'Я уважаю всех членов управленческой команды' },
			{ index: 101, title: 'Честно говоря, некоторые члены нашей команды вызывают во мне неприязнь' },
			{ index: 102, title: 'Некоторые члены нашей команды постоянно находятся в плохом настроении' },
			{ index: 103, title: 'Мои коллеги всегда приходят на совещание с полной информацией по обсуждаемому вопросу' },
			{ index: 104, title: 'Некоторые члены нашей управленческой команды не уступят своих полномочий и власти, даже если речь будет идти об общем результате компании' },
			{ index: 105, title: 'Решения в управленческой команде принимаются по привычному сценарию' },
			{ index: 106, title: 'Обсуждая задачи и проблемы, несогласие изучается, а не подавляется' },
			{ index: 107, title: 'Вся корпоративная информация мне знакома и понятна' },
			{ index: 108, title: 'В нашей компании лучше держать свои знания при себе' },
			{ index: 109, title: 'Мы с коллегами регулярно даем друг другу обратную связь, как негативную, так и позитивную' },
			{ index: 110, title: 'У меня хватает время на учебу' },
			{ index: 111, title: 'Все члены нашей команды выполняют свои задачи качественно' },
			{ index: 112, title: 'Я доволен работой нашего СEO' },
		],
		scales: [
			{ name: 'Руководитель.Видение', questions: [29, 1, 85, 57] },
			{ name: 'Руководитель.Результативность', questions: [2, 30, 58, 86] },
			{ name: 'Руководитель.Системность', questions: [3] },
			{ name: 'Команда.Состав', questions: [4, 32, 88, 60] },
			{ name: 'Команда.Роли', questions: [5, 33, 61, 89] },
			{ name: 'Команда.Квалификация', questions: [6, 34, 62, 90] },
			{ name: 'Команда.Ценности', questions: [7, 35, 91, 63] },
			{ name: 'Стратегия.Четкость', questions: [8, 36, 64, 92] },
			{ name: 'Стратегия.Разделяемость', questions: [9, 37, 65, 93] },
			{ name: 'Организация.Обязанности-функция', questions: [10, 38, 94, 66] },
			{ name: 'Организация.Полномочия-обязанности', questions: [11, 39, 95, 67] },
			{ name: 'Организация.Контроль', questions: [40, 12, 68, 96] },
			{ name: 'Организация.Мотивация', questions: [13, 41, 69, 97] },
			{ name: 'Климат.Доверие', questions: [14, 42, 98, 70] },
			{ name: 'Климат.Безопасность', questions: [15, 43, 99, 71] },
			{ name: 'Климат.Уважение', questions: [16, 44, 72, 100] },
			{ name: 'Климат.Симпатия', questions: [17, 45, 73, 101] },
			{ name: 'Климат.Настроение', questions: [18, 46, 74, 102] },
			{ name: 'Процессы.Информация', questions: [19, 47, 75, 103] },
			{ name: 'Процессы.Общий результат', questions: [20, 48, 76, 104] },
			{ name: 'Процессы.Прозрачность решений', questions: [21, 77, 105, 49] },
			{ name: 'Процессы.Сотрудничество', questions: [22, 50, 106, 78] },
			{ name: 'Коммуникации.Актуальность информации', questions: [23, 51, 107, 79] },
			{ name: 'Коммуникации.Доступность информации', questions: [24, 52, 80, 108] },
			{ name: 'Коммуникации.Обратная связь', questions: [25, 53, 81, 109] },
			{ name: 'Развитие', questions: [26, 82, 110, 54] },
			{ name: 'Итоги.Достижение', questions: [27, 55, 83, 111] },
			{ name: 'Итоги.Удовлетворенность', questions: [28, 56, 112, 84] },
		]
	};

	const options = {
		"Нет, это совсем не так": 1,
		"Скорее нет, чем да": 2,
		"Затрудняюсь ответить": 3,
		"Скорее да, чем нет": 4,
		"Да, совершенно верно": 5,
	};

	const optionsRev = {
		"Нет, это совсем не так": 5,
		"Скорее нет, чем да": 4,
		"Затрудняюсь ответить": 3,
		"Скорее да, чем нет": 2,
		"Да, совершенно верно": 1,
	};

	const reversed = [47, 49, 54, 57, 60, 63, 66, 67, 70, 71, 72, 78, 79, 81, 83, 84, 86, 87, 89, 90, 92, 93, 96, 97, 101, 102, 104, 108];

	return {
		...questionnaire,
		questions: questionnaire.questions.map(q => ({ ...q, options: reversed.includes(q.index) ? optionsRev : options }))
	};
}
