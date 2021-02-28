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

	const q1 = getQuestionnaire1();
	const COL_Q1_START = 2;
	const COL_Q1_FINISH = 113;

	const q2 = getQuestionnaire2();
	const COL_Q2_START = 114;
	const COL_Q2_FINISH = 218;

	const participantResponse: ParticipantResponse = {
		company: row[COL_COMPANY],
		questionnaires: [
			{
				questionnaireName: q1.name,
				responses: row
					.filter((_, i) => i >= COL_Q1_START && i <= COL_Q1_FINISH)
					.reduce((responses, value, i) => {
						responses[i + 1] = q1.questions.find(q => q.index === i + 1).options[value];
						return responses;
					}, {}),
			},
			{
				questionnaireName: q2.name,
				responses: row
					.filter((_, i) => i >= COL_Q2_START && i <= COL_Q2_FINISH)
					.reduce((responses, value: string, i) => {
						responses[i + 1] = q2.questions.find(q => q.index === i + 1).options[value.toString().toLowerCase().replace(/\s+/g, ' ')];
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

function getQuestionnaire2(): Questionnaire {
	const questionnaire = {
		name: 'Кеттелл',
		questions: [
			{ index: 1, title: 'Я думаю, что моя память сейчас лучше, чем была раньше:', options: { A: 'да', B: 'трудно сказать', C: 'нет' } },
			{ index: 2, title: 'Я бы вполне мог жить один, вдали от людей:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 3, title: 'Если предположить, что небо находится внизу и что зимой жарко, я должен был бы назвать преступника:', options: { A: 'бандитом', B: 'святым', C: 'тучей' } },
			{ index: 4, title: 'Когда я ложусь спать, то:', options: { A: 'быстро', B: 'нечто среднее', C: 'с трудом' } },
			{ index: 5, title: 'Если бы я вел машину по дороге, где много других автомобилей, я предпочел бы:', options: { A: 'пропустить вперед большинство машин', B: 'не знаю', C: 'обогнать все идущие впереди машины' } },
			{ index: 6, title: 'В компании я предоставляю возможность другим шутить и рассказывать всякие истории:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 7, title: 'Мне важно, чтобы во всем окружающем не было беспорядка:', options: { A: 'верно', B: 'трудно сказать', C: 'неверно' } },
			{ index: 8, title: 'Большинство людей, с которыми я бываю в компании, несомненно, рады меня видеть:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 9, title: 'Мне больше нравится:', options: { A: 'фехтованием и танцами', B: 'затрудняюсь сказать', C: 'борьбой и баскетболом' } },
			{ index: 10, title: 'Меня забавляет несоответствие между тем, что люди делают, и тем, что они рассказывают об этом:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 11, title: 'Читая о каком-либо происшествии, я интересуюсь всеми подробностями:', options: { A: 'всегда', B: 'иногда', C: 'редко' } },
			{ index: 12, title: 'Когда друзья подшучивают надо мной, я смеюсь вместе со всеми и не обижаюсь:', options: { A: 'верно', B: 'не знаю', C: 'неверно' } },
			{ index: 13, title: 'Если мне кто-нибудь нагрубит, я могу быстро забыть об этом:', options: { A: 'верно', B: 'не знаю', C: 'неверно' } },
			{ index: 14, title: 'Мне больше нравится придумывать новые способы выполнения какой-либо работы, чем придерживаться испытанных приемов:', options: { A: 'верно', B: 'не знаю', C: 'неверно' } },
			{ index: 15, title: 'Когда я планирую что-нибудь, я предпочитаю делать это самостоятельно, без чьей-либо помощи:', options: { A: 'верно', B: 'иногда', C: 'неверно' } },
			{ index: 16, title: 'Думаю, что я менее чувствительный и менее возбудимый, чем большинство людей:', options: { A: 'верно', B: 'затрудняюсь ответить', C: 'неверно' } },
			{ index: 17, title: 'Меня раздражают люди, которые не могут быстро принимать решения:', options: { A: 'верно', B: 'не знаю', C: 'неверно' } },
			{ index: 18, title: 'Иногда, хотя и кратковременно, у меня возникает чувство раздражения по отношению к моим родителям:', options: { A: 'да', B: 'не знаю', C: 'нет' } },
			{ index: 19, title: 'Я скорее бы раскрыл свои сокровенные мысли:', options: { A: 'моим хорошим друзьям', B: 'не знаю', C: 'в своем дневнике' } },
			{ index: 20, title: 'Я думаю, что слово, противоположное по смыслу слову «неточный» — это:', options: { A: 'небрежный', B: 'тщательный', C: 'приблизительный' } },
			{ index: 21, title: 'У меня, как правило, хватает энергии, когда мне это необходимо:', options: { A: 'да', B: 'трудно сказать', C: 'нет' } },
			{ index: 22, title: 'Меня больше раздражают люди которые:', options: { A: 'своими грубыми шутками вгоняют людей в краску', B: 'затрудняюсь ответить', C: 'cоздают неудобства для меня, опаздывая на условленную встречу' } },
			{ index: 23, title: 'Мне очень нравится приглашать гостей и развлекать их:', options: { A: 'верно', B: 'не знаю', C: 'неверно' } },
			{ index: 24, title: 'Я думаю, что:', options: { A: 'не все надо делать одинаково тщательно', B: 'затрудняюсь сказать', C: 'любую работу следует выполнять тщательно, если вы за нее взялись' } },
			{ index: 25, title: 'Мне обычно приходится преодолевать смущение:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 26, title: 'Мои друзья чаще:', options: { A: 'советуются со мной', B: 'делают и то и другое поровну', C: 'дают мне советы' } },
			{ index: 27, title: 'Если приятель обманывает меня в мелочах, я скорее предпочитаю сделать вид, что не заметил этого, чем разоблачить его:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 28, title: 'Я предпочитаю друзей:', options: { A: 'интересы которого имеют деловой и практический характер', B: 'не знаю', C: 'который отличается глубоко продуманными взглядами на жизнь' } },
			{ index: 29, title: 'Я не могу равнодушно слушать, как другие люди высказывают идеи, противоположные тем, в которые я твердо верю:', options: { A: 'верно', B: 'затрудняюсь сказать', C: 'неверно' } },
			{ index: 30, title: 'Меня волнуют мои прошлые поступки и ошибки:', options: { A: 'да', B: 'не знаю', C: 'нет' } },
			{ index: 31, title: 'Если бы я одинаково хорошо умел и то и другое, то я бы предпочел:', options: { A: 'играть в шахматы', B: 'затрудняюсь сказать', C: 'играть в городки' } },
			{ index: 32, title: 'Мне нравятся общительные, компанейские люди:', options: { A: 'да', B: 'не знаю', C: 'нет' } },
			{ index: 33, title: 'Я настолько осторожен и практичен, что со мной случается меньше неприятных неожиданностей, чем с другими людьми:', options: { A: 'да', B: 'трудно сказать', C: 'нет' } },
			{ index: 34, title: 'Я могу забыть о своих заботах и обязанностях, когда мне это необходимо:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 35, title: 'Мне бывает трудно признать, что я не прав:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 36, title: 'На предприятии было бы интереснее:', options: { A: 'работать с машинами и механизмами и участвовать в основном производстве', B: 'трудно сказать', C: 'беседовать с людьми, занимаясь общественной работой' } },
			{ index: 37, title: 'Какое слово не связано с другими?', options: { A: 'луна', B: 'воздух', C: 'солнце' } },
			{ index: 38, title: 'То, что в некоторой степени отвлекает мое внимание:', options: { A: 'раздражает меня', B: 'нечто среднее', C: 'не беспокоит меня совершенно' } },
			{ index: 39, title: 'Если бы у меня было много денег, то я:', options: { A: 'позаботился бы о том, чтобы не вызывать к себе зависти', B: 'не знаю', C: 'жил бы, не стесняя себя ни в чем' } },
			{ index: 40, title: 'Худшее наказание для меня:', options: { A: 'тяжелая работа', B: 'не знаю', C: 'быть запертым в одиночестве' } },
			{ index: 41, title: 'Люди должны больше, чем сейчас, соблюдать нравственные нормы:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 42, title: 'Мне говорили, что ребенком я был:', options: { A: 'спокойным и любил оставаться один', B: 'трудно сказать', C: 'живым и подвижным' } },
			{ index: 43, title: 'Я предпочел бы работать с приборами:', options: { A: 'да', B: 'не знаю', C: 'нет' } },
			{ index: 44, title: 'Думаю, что большинство свидетелей на суде говорят правду, даже если это нелегко для них:', options: { A: 'да', B: 'трудно сказать', C: 'нет' } },
			{ index: 45, title: 'Иногда я не решаюсь проводить в жизнь свои идеи, потому что они кажутся мне неосуществимыми', options: { A: 'верно', B: 'затрудняюсь ответить', C: 'неверно' } },
			{ index: 46, title: 'Я стараюсь смеяться над шутками не так громко, как делают большинство людей:', options: { A: 'верно', B: 'не знаю', C: 'неверно' } },
			{ index: 47, title: 'Я никогда не чувствовал себя таким несчастным, чтобы хотелось плакать:', options: { A: 'верно', B: 'не знаю', C: 'неверно' } },
			{ index: 48, title: 'Мне больше нравятся:', options: { A: 'маршами в исполнении духовых оркестров', B: 'не знаю', C: 'скрипичными соло' } },
			{ index: 49, title: 'Я скорее бы предпочел провести отпуск:', options: { A: 'в деревне с одним или двумя друзьями', B: 'затрудняюсь сказать', C: 'возглавляя группу в туристическом лагере' } },
			{ index: 50, title: 'Усилия, затраченные на составление планов:', options: { A: 'никогда не лишние', B: 'трудно сказать', C: 'не стоят этого' } },
			{ index: 51, title: 'Необдуманные поступки и высказывания моих приятелей в мой адрес не обижают меня и не огорчают:', options: { A: 'верно', B: 'не знаю', C: 'неверно' } },
			{ index: 52, title: 'Когда мне все удается, я нахожу все дела легкими:', options: { A: 'всегда', B: 'иногда', C: 'редко' } },
			{ index: 53, title: 'Я предпочел бы скорее работать:', options: { A: 'в учреждении, где мне пришлось бы руководить людьми и все время быть среди них', B: 'затрудняюсь ответить', C: 'архитектором, который в тихой комнате разрабатывает свой проект' } },
			{ index: 54, title: 'Дом так относится к комнате, как дерево к:', options: { A: 'лесу', B: 'растению', C: 'листу' } },
			{ index: 55, title: 'То, что я делаю, у меня не получается:', options: { A: 'редко', B: 'иногда', C: 'часто' } },
			{ index: 56, title: 'В большинстве дел я:', options: { A: 'предпочитаю рискнуть', B: 'не знаю', C: 'предпочитаю действовать наверняка' } },
			{ index: 57, title: 'Вероятно, некоторые люди считают, что я слишком много говорю:', options: { A: 'скорее всего, так', B: 'не знаю', C: 'думаю, что нет' } },
			{ index: 58, title: 'Мне больше нравится человек:', options: { A: 'большого ума, будь он даже ненадежен и непостоянен', B: 'трудно сказать', C: 'со средними способностями, но зато умеющий противостоять всяким соблазнам' } },
			{ index: 59, title: 'Я принимаю решения:', options: { A: 'быстрее, чем многие люди', B: 'не знаю', C: 'медленнее, чем большинство людей' } },
			{ index: 60, title: 'На меня большое впечатление производят:', options: { A: 'мастерство и изящество', B: 'трудно сказать', C: 'сила и мощь' } },
			{ index: 61, title: 'Я считаю себя человеком, склонным к сотрудничеству:', options: { A: 'да', B: 'нечто среднее', C: 'нет' } },
			{ index: 62, title: 'Мне больше нравится разговаривать с людьми изысканными, утонченными, чем с откровенными и прямолинейными:', options: { A: 'да', B: 'не знаю', C: 'нет' } },
			{ index: 63, title: 'Я предпочитаю:', options: { A: 'сам решать вопросы, касающиеся меня лично', B: 'затрудняюсь ответить', C: 'советоваться с моими друзьями' } },
			{ index: 64, title: 'Если человек сразу не отвечает на мои слова, то я чувствую, что сказал какую-то глупость:', options: { A: 'верно', B: 'не знаю', C: 'неверно' } },
			{ index: 65, title: 'В школьные годы я больше всего получал знаний:', options: { A: 'на уроках', B: 'не знаю', C: 'читая книги' } },
			{ index: 66, title: 'Я избегаю общественной работы и связанной с этим ответственности:', options: { A: 'верно', B: 'иногда', C: 'неверно' } },
			{ index: 67, title: 'Если очень трудный вопрос требует от меня очень много усилий, то я:', options: { A: 'заняться другим вопросом', B: 'затрудняюсь ответить', C: 'еще раз попытаюсь решить этот вопрос' } },
			{ index: 68, title: 'У меня возникают сильные эмоции: тревога, гнев, приступы смеха и т.д., казалось бы, без определенных причин:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 69, title: 'Иногда я соображаю хуже, чем обычно:', options: { A: 'верно', B: 'не знаю', C: 'неверно' } },
			{ index: 70, title: 'Мне приятно сделать человеку одолжение: согласившись назначить встречу с ним на время, удобное для него, даже если это немного неудобно для меня:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 71, title: 'Я думаю, что правильное число, которое должно продолжить ряд 1,2,3,6,5 — будет:', options: { A: '10', B: '5', C: '7' } },
			{ index: 72, title: 'Иногда у меня бывают непродолжительные приступы тошноты и головокружения без определенной причины:', options: { A: 'да', B: 'не знаю', C: 'нет' } },
			{ index: 73, title: 'Я предпочитаю скорее отказаться от своего заказа, чем доставить официанту или официантке лишнее беспокойство:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 74, title: 'Я живу сегодняшним днем в большей степени, чем другие люди:', options: { A: 'верно', B: 'трудно сказать', C: 'неверно' } },
			{ index: 75, title: 'На вечеринке мне нравится:', options: { A: 'принимать участие в интенсивной беседе', B: 'затрудняюсь сказать', C: 'Смотреть, как люди отдыхают, и просто отдыхать самому' } },
			{ index: 76, title: 'Я высказываю свое мнение независимо от того, кто меня слушает:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 77, title: 'Если бы я мог перенестись в прошлое, то больше я хотел бы встретиться:', options: { A: 'Колумбомм', B: 'не знаю', C: 'Пушкиным' } },
			{ index: 78, title: 'Я вынужден сдерживать себя от того, чтобы не улаживать чужие дела:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 79, title: 'Если люди обо мне плохо думают, я не стараюсь переубедить их, а продолжаю поступать так, как считаю нужным:', options: { A: 'да', B: 'трудно сказать', C: 'нет' } },
			{ index: 80, title: 'Работая в магазине, я предпочел бы:', options: { A: 'оформлять витрины', B: 'не знаю', C: 'быть кассиром' } },
			{ index: 81, title: 'Если я вижу, что мой старый друг холоден со мной и избегает меня, я обычно:', options: { A: 'сразу же думаю: «У него плохое настроение»', B: 'не знаю', C: 'беспокоюсь о том, какой неверный поступок я совершил' } },
			{ index: 82, title: 'Многие неприятности происходят из-за людей:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 83, title: 'Я получаю большое удовлетворение, рассказывая местные новости:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 84, title: 'Аккуратные, требовательные люди не уживаются со мной:', options: { A: 'верно', B: 'иногда', C: 'неверно' } },
			{ index: 85, title: 'Мне кажется, что я менее раздражителен, чем большинство людей:', options: { A: 'верно', B: 'не знаю', C: 'неверно' } },
			{ index: 86, title: 'Я могу легче не считаться с другими людьми, чем они со мной:', options: { A: 'верно', B: 'иногда', C: 'неверно' } },
			{ index: 87, title: 'Бывает, что все утро я не хочу ни с кем разговаривать:', options: { A: 'часто', B: 'иногда', C: 'никогда' } },
			{ index: 88, title: 'Если стрелки часов встречаются ровно через 65 минут, отмеренных на точных часах, то эти часы:', options: { A: 'отстают', B: 'идут правильно', C: 'спешат' } },
			{ index: 89, title: 'Мне бывает скучно:', options: { A: 'часто', B: 'иногда', C: 'редко' } },
			{ index: 90, title: 'Люди говорят, что мне нравится все делать своим оригинальным способом:', options: { A: 'верно', B: 'иногда', C: 'неверно' } },
			{ index: 91, title: 'Я считаю, что нужно избегать излишних волнений, потому что они утомительны:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 92, title: 'Дома в свободное время я-.', options: { A: 'отдыхаю от всех дел', B: 'затрудняюсь сказать', C: 'занимаюсь интересующими меня делами' } },
			{ index: 93, title: 'Я осторожно отношусь к завязыванию дружеских отношений с новыми людьми:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 94, title: 'Я считаю, что то, что люди говорят стихами, можно также выразить прозой:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 95, title: 'Мне кажется, что люди, с которыми я нахожусь в дружеских отношениях, могут оказаться отнюдь не друзьями за моей спиной:', options: { A: 'да, в большинстве случаев', B: 'иногда', C: 'нет' } },
			{ index: 96, title: 'Мне кажется, что даже драматические события через год уже не оставляют в моей душе никаких следов:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 97, title: 'Я думаю, что интереснее:', options: { A: 'натуралистом и работать с растениями', B: 'не знаю', C: 'быть страховым агентом' } },
			{ index: 98, title: 'Я подвержен суевериям и беспричинному страху по отношению к некоторым вещам: к определенным животным, местам, датам и т.д.:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 99, title: 'Я люблю размышлять о том, как можно было бы улучшить мир;', options: { A: 'да', B: 'трудно сказать', C: 'нет' } },
			{ index: 100, title: 'Я предпочитаю игры:', options: { A: 'где надо играть в команде или иметь партнера', B: 'не знаю', C: 'где каждый играет за себя' } },
			{ index: 101, title: 'Ночью мне снятся фантастические, нелепые сны:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 102, title: 'Если я остаюсь один, то через некоторое время ощущаю тревогу и страх:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 103, title: 'Я могу своим дружеским отношением ввести людей в заблуждение, хотя на самом деле они мне не нравятся:', options: { A: 'да', B: 'иногда', C: 'нет' } },
			{ index: 104, title: 'Какое слово отличается от двух других?', options: { A: 'думать', B: 'видеть', C: 'слышать' } },
			{ index: 105, title: 'Если мать Марии является сестрой отца Александра, то кем является Александр по отношению к отцу Марии?', options: { A: 'двоюродным братом', B: 'племянником', C: 'дядей' } },],
		scales: [
			{ name: 'A', questions: [2, 19, 36, 53, 70, 87] },
			{ name: 'B', questions: [3, 20, 37, 54, 71, 88, 104, 105] },
			{ name: 'C', questions: [4, 21, 38, 55, 72, 89] },
			{ name: 'E', questions: [5, 22, 39, 56, 73, 90] },
			{ name: 'F', questions: [6, 23, 40, 57, 74, 91] },
			{ name: 'G', questions: [7, 24, 41, 58, 75, 92] },
			{ name: 'H', questions: [8, 25, 42, 59, 76, 93] },
			{ name: 'J', questions: [9, 26, 43, 60, 77, 94] },
			{ name: 'L', questions: [10, 27, 44, 61, 78, 95] },
			{ name: 'M', questions: [11, 28, 45, 62, 80, 96] },
			{ name: 'N', questions: [12, 29, 46, 63, 79, 97] },
			{ name: 'O', questions: [13, 30, 47, 64, 81, 98] },
			{ name: 'Q1', questions: [14, 31, 48, 65, 82, 99] },
			{ name: 'Q2', questions: [15, 32, 49, 66, 83, 100] },
			{ name: 'Q3', questions: [16, 33, 50, 67, 84, 101] },
			{ name: 'Q4', questions: [17, 34, 51, 68, 85, 102] },
			{ name: 'МД', questions: [1, 18, 35, 52, 69, 86, 103] },],
	};

	const key = [
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 0, C: 1 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 0, C: 1 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 1, B: 0, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 0, C: 1 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 0, B: 1, C: 2 },
		{ A: 2, B: 1, C: 0 },
		{ A: 0, B: 1, C: 2 },
		{ A: 1, B: 0, C: 0 },
		{ A: 0, B: 1, C: 0 },
	];

	return {
		...questionnaire,
		questions: questionnaire.questions.map(q => ({
			...q,
			options: {
				[q.options.A]: key[q.index - 1].A,
				[q.options.B]: key[q.index - 1].B,
				[q.options.C]: key[q.index - 1].C,
			}
		}))
	};
}
