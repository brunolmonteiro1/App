// Tabela estática dos 66 livros da Bíblia (pt-BR) com variantes e abreviações.
// Usada pelo motor bíblico determinístico (PIPELINE.md §2).

export interface BibleBook {
  name: string; // nome canônico pt-BR
  slug: string;
  testament: "AT" | "NT";
  order: number;
  variants: string[]; // formas aceitas no texto (sem acento também é gerado)
}

const b = (name: string, slug: string, testament: "AT" | "NT", order: number, variants: string[] = []): BibleBook => ({
  name,
  slug,
  testament,
  order,
  variants: [name, ...variants],
});

export const BIBLE_BOOKS: BibleBook[] = [
  b("Gênesis", "genesis", "AT", 1, ["Genesis", "Gn"]),
  b("Êxodo", "exodo", "AT", 2, ["Exodo", "Ex"]),
  b("Levítico", "levitico", "AT", 3, ["Levitico", "Lv"]),
  b("Números", "numeros", "AT", 4, ["Numeros", "Nm"]),
  b("Deuteronômio", "deuteronomio", "AT", 5, ["Deuteronomio", "Dt"]),
  b("Josué", "josue", "AT", 6, ["Josue", "Js"]),
  b("Juízes", "juizes", "AT", 7, ["Juizes", "Jz"]),
  b("Rute", "rute", "AT", 8, ["Rt"]),
  b("1 Samuel", "1-samuel", "AT", 9, ["1Samuel", "1 Sm", "1Sm", "Primeiro Samuel", "I Samuel"]),
  b("2 Samuel", "2-samuel", "AT", 10, ["2Samuel", "2 Sm", "2Sm", "Segundo Samuel", "II Samuel"]),
  b("1 Reis", "1-reis", "AT", 11, ["1Reis", "1 Rs", "1Rs", "Primeiro Reis", "I Reis"]),
  b("2 Reis", "2-reis", "AT", 12, ["2Reis", "2 Rs", "2Rs", "Segundo Reis", "II Reis"]),
  b("1 Crônicas", "1-cronicas", "AT", 13, ["1 Cronicas", "1Cronicas", "1 Cr", "1Cr", "I Crônicas"]),
  b("2 Crônicas", "2-cronicas", "AT", 14, ["2 Cronicas", "2Cronicas", "2 Cr", "2Cr", "II Crônicas"]),
  b("Esdras", "esdras", "AT", 15, ["Ed"]),
  b("Neemias", "neemias", "AT", 16, ["Ne"]),
  b("Ester", "ester", "AT", 17, ["Et"]),
  b("Jó", "jo-livro", "AT", 18, ["Job"]),
  b("Salmos", "salmos", "AT", 19, ["Salmo", "Sl"]),
  b("Provérbios", "proverbios", "AT", 20, ["Proverbios", "Pv", "Provérbio"]),
  b("Eclesiastes", "eclesiastes", "AT", 21, ["Ec"]),
  b("Cantares", "cantares", "AT", 22, ["Cânticos", "Canticos", "Cantares de Salomão", "Ct"]),
  b("Isaías", "isaias", "AT", 23, ["Isaias", "Is"]),
  b("Jeremias", "jeremias", "AT", 24, ["Jr"]),
  b("Lamentações", "lamentacoes", "AT", 25, ["Lamentacoes", "Lm", "Lamentações de Jeremias"]),
  b("Ezequiel", "ezequiel", "AT", 26, ["Ez"]),
  b("Daniel", "daniel", "AT", 27, ["Dn"]),
  b("Oseias", "oseias", "AT", 28, ["Oséias", "Os"]),
  b("Joel", "joel", "AT", 29, ["Jl"]),
  b("Amós", "amos", "AT", 30, ["Amos", "Am"]),
  b("Obadias", "obadias", "AT", 31, ["Ob"]),
  b("Jonas", "jonas", "AT", 32, ["Jn"]),
  b("Miqueias", "miqueias", "AT", 33, ["Miquéias", "Mq"]),
  b("Naum", "naum", "AT", 34, ["Na"]),
  b("Habacuque", "habacuque", "AT", 35, ["Hc"]),
  b("Sofonias", "sofonias", "AT", 36, ["Sf"]),
  b("Ageu", "ageu", "AT", 37, ["Ag"]),
  b("Zacarias", "zacarias", "AT", 38, ["Zc"]),
  b("Malaquias", "malaquias", "AT", 39, ["Ml"]),
  b("Mateus", "mateus", "NT", 40, ["Mt"]),
  b("Marcos", "marcos", "NT", 41, ["Mc"]),
  b("Lucas", "lucas", "NT", 42, ["Lc"]),
  b("João", "joao", "NT", 43, ["Joao", "Jo"]),
  b("Atos", "atos", "NT", 44, ["Atos dos Apóstolos", "Atos dos Apostolos", "At"]),
  b("Romanos", "romanos", "NT", 45, ["Rm"]),
  b("1 Coríntios", "1-corintios", "NT", 46, ["1 Corintios", "1Corintios", "1 Co", "1Co", "Primeira Coríntios", "I Coríntios", "Primeira aos Coríntios"]),
  b("2 Coríntios", "2-corintios", "NT", 47, ["2 Corintios", "2Corintios", "2 Co", "2Co", "Segunda Coríntios", "II Coríntios", "Segunda aos Coríntios"]),
  b("Gálatas", "galatas", "NT", 48, ["Galatas", "Gl"]),
  b("Efésios", "efesios", "NT", 49, ["Efesios", "Ef"]),
  b("Filipenses", "filipenses", "NT", 50, ["Fp"]),
  b("Colossenses", "colossenses", "NT", 51, ["Cl"]),
  b("1 Tessalonicenses", "1-tessalonicenses", "NT", 52, ["1 Ts", "1Ts", "Primeira Tessalonicenses", "I Tessalonicenses"]),
  b("2 Tessalonicenses", "2-tessalonicenses", "NT", 53, ["2 Ts", "2Ts", "Segunda Tessalonicenses", "II Tessalonicenses"]),
  b("1 Timóteo", "1-timoteo", "NT", 54, ["1 Timoteo", "1Timoteo", "1 Tm", "1Tm", "Primeira Timóteo", "I Timóteo"]),
  b("2 Timóteo", "2-timoteo", "NT", 55, ["2 Timoteo", "2Timoteo", "2 Tm", "2Tm", "Segunda Timóteo", "II Timóteo"]),
  b("Tito", "tito", "NT", 56, ["Tt"]),
  b("Filemom", "filemom", "NT", 57, ["Filemon", "Fm"]),
  b("Hebreus", "hebreus", "NT", 58, ["Hb"]),
  b("Tiago", "tiago", "NT", 59, ["Tg"]),
  b("1 Pedro", "1-pedro", "NT", 60, ["1Pedro", "1 Pe", "1Pe", "Primeira Pedro", "I Pedro"]),
  b("2 Pedro", "2-pedro", "NT", 61, ["2Pedro", "2 Pe", "2Pe", "Segunda Pedro", "II Pedro"]),
  b("1 João", "1-joao", "NT", 62, ["1 Joao", "1Joao", "1 Jo", "1Jo", "Primeira João", "Primeira de João", "I João"]),
  b("2 João", "2-joao", "NT", 63, ["2 Joao", "2Joao", "2 Jo", "2Jo", "Segunda João", "II João"]),
  b("3 João", "3-joao", "NT", 64, ["3 Joao", "3Joao", "3 Jo", "3Jo", "Terceira João", "III João"]),
  b("Judas", "judas", "NT", 65, ["Jd"]),
  b("Apocalipse", "apocalipse", "NT", 66, ["Ap"]),
];

export const BOOK_BY_SLUG = new Map(BIBLE_BOOKS.map((bk) => [bk.slug, bk]));
