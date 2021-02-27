export type Questionnaire = {
    name: string;
    questions: Question[];
    scales: Scale[];
};

export type Question = {
    index: number;
    title: string;
    options: Record<string, number>;
};

export type Scale = {
    name: string;
    questions: number[];
};

export type CompletedQuestionnaire = {
    questionnaireName: string;
    responses: Record<number, number>;
};

export type ParticipantResponse = {
    company: string;
    questionnaires: CompletedQuestionnaire[];
};

