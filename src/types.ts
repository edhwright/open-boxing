export interface Champion {
	championId: number;
	name: {
		first: string;
		last: string;
		short: string;
	};
	born: string;
}

// a boxer who has never won a world title,
// so not in the champions.csv
export interface Challenger {
	name: string;
}

export type Boxer = Champion | Challenger;

export interface Title {
	weight: {
		class: string;
		lb: string;
	};
	org: {
		name: {
			full: string;
			short: string;
			abbreviation: string;
		};
	};
	active: boolean;
}

export interface Reign {
	reign_id: number;
	period: {
		begins: string;
		ends: string | null;
		current: boolean;
	};
	champion: Champion;
	title: Title;
	references: Reference[];
}

export interface Bout {
	boutId: number;
	date: string;
	boxers: {
		boxerA: Boxer;
		boxerB: Boxer;
	};
	status: "FINISHED" | "SCHEDULED";
	result: {
		winner: "BOXER A" | "BOXER B" | "DRAW" | "NO CONTEST" | null;
		methodOfVictory: string | null;
		totalRounds: number | null;
	};
	scheduledRounds: number;
	weight: {
		class: string;
		lb: string;
	};
	titles: Title[];
	location: {
		locationId: number | null;
		venue: string | null;
		locality: string | null;
		country: string | null;
		latitude: number | null;
		longitude: number | null;
	};
	references: Reference[];
}

export interface Reference {
	referenceId: number;
	title: string;
	author: string | null;
	publication: string;
	publicationDate: string;
	boutId: number | null;
	reignId: number | null;
	eventDate: string;
	link: {
		text: string;
		url: string;
	};
}
