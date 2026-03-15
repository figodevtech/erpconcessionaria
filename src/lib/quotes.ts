export type Quote = {
    text: string;
    author: string;
    obs: string;
};

export const QUOTES: Quote[] = [
    { text: "A persistência é o caminho do êxito.", author: "Charles Chaplin", obs: "Ator e cineasta" },
    { text: "Somos o que repetidamente fazemos. A excelência, portanto, não é um ato, mas um hábito.", author: "Aristóteles", obs: "Filósofo grego" },
    { text: "A vida é 10% o que acontece com você e 90% como você reage.", author: "Charles R. Swindoll", obs: "Pastor e escritor" },
    { text: "Nada é impossível; a própria palavra diz 'eu sou possível'.", author: "Audrey Hepburn", obs: "Atriz e humanitária" },
    { text: "Coragem não é ausência do medo; é a vitória sobre ele.", author: "Nelson Mandela", obs: "Líder sul-africano" },
    { text: "A sorte favorece a mente preparada.", author: "Louis Pasteur", obs: "Cientista francês" },
    { text: "O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.", author: "Winston Churchill", obs: "Primeiro-ministro britânico" },
    { text: "A melhor maneira de prever o futuro é criá-lo.", author: "Peter Drucker", obs: "Teórico da administração" },
    { text: "Comece onde você está. Use o que você tem. Faça o que você pode.", author: "Arthur Ashe", obs: "Tenista americano" },
    { text: "A única maneira de fazer um excelente trabalho é amar o que você faz.", author: "Steve Jobs", obs: "Fundador da Apple" },
    { text: "Você nunca é velho demais para ter outra meta ou um novo sonho.", author: "C. S. Lewis", obs: "Escritor britânico" },
    { text: "O medo derrota mais pessoas do que qualquer outra coisa no mundo.", author: "Ralph Waldo Emerson", obs: "Filósofo americano" },
    { text: "Seja a mudança que você deseja ver no mundo.", author: "Mahatma Gandhi", obs: "Líder pacifista" },
    { text: "A disciplina é a ponte entre metas e realizações.", author: "Jim Rohn", obs: "Palestrante motivacional" },
    { text: "Aquilo que você pensa, você se torna.", author: "Buda", obs: "Fundador do budismo" },
    { text: "A adversidade revela o gênio; a prosperidade o oculta.", author: "Horácio", obs: "Poeta romano" },
    { text: "Não é que eu seja inteligente, apenas permaneço com os problemas por mais tempo.", author: "Albert Einstein", obs: "Físico teórico" },
    { text: "Faça o melhor que puder, onde estiver, com o que tiver.", author: "Theodore Roosevelt", obs: "Presidente dos EUA" },
    { text: "A jornada de mil milhas começa com um único passo.", author: "Lao Tsé", obs: "Filósofo chinês" },
    { text: "A única coisa que cai do céu é a chuva.", author: "Provérbio", obs: "Dito popular" },
    { text: "Acredite que você pode, e você já está no meio do caminho.", author: "Theodore Roosevelt", obs: "Presidente dos EUA" },
    { text: "Seu tempo é limitado; não o desperdice vivendo a vida de outra pessoa.", author: "Steve Jobs", obs: "Fundador da Apple" },
    { text: "O que não nos mata nos torna mais fortes.", author: "Friedrich Nietzsche", obs: "Filósofo alemão" },
    { text: "Não importa quão devagar você vá, desde que você não pare.", author: "Confúcio", obs: "Filósofo chinês" },
    { text: "Grandes obras são feitas não com força, mas com perseverança.", author: "Samuel Johnson", obs: "Escritor inglês" },
    { text: "A criatividade é a inteligência se divertindo.", author: "Albert Einstein", obs: "Físico teórico" },
    { text: "Tudo o que você sempre quis está do outro lado do medo.", author: "George Addair", obs: "Empresário" },
    { text: "Seja fiel a si mesmo.", author: "William Shakespeare", obs: "Dramaturgo inglês" },
    { text: "O sucesso normalmente vem para quem está ocupado demais para procurar por ele.", author: "Henry David Thoreau", obs: "Filósofo americano" },
    { text: "Você perde 100% dos tiros que não dá.", author: "Wayne Gretzky", obs: "Jogador de hóquei" },
    { text: "O que você faz hoje pode melhorar todos os seus amanhãs.", author: "Ralph Marston", obs: "Escritor motivacional" },
    { text: "Mantenha seus olhos nas estrelas e os pés no chão.", author: "Theodore Roosevelt", obs: "Presidente dos EUA" },
    { text: "A energia e a persistência conquistam todas as coisas.", author: "Benjamin Franklin", obs: "Político e inventor" },
    { text: "A vida é realmente simples, mas insistimos em torná-la complicada.", author: "Confúcio", obs: "Filósofo chinês" },
    { text: "A mente é tudo. Você se torna aquilo que você pensa.", author: "Buda", obs: "Fundador do budismo" },
    { text: "Age como se aquilo que você faz fizesse diferença. Faz.", author: "William James", obs: "Filósofo e psicólogo" },
    { text: "Não conte os dias; faça os dias contarem.", author: "Muhammad Ali", obs: "Lutador de boxe" },
    { text: "A imaginação governa o mundo.", author: "Napoleão Bonaparte", obs: "Imperador francês" },
    { text: "O otimista vê oportunidades em cada dificuldade.", author: "Winston Churchill", obs: "Primeiro-ministro britânico" },
    { text: "A força não vem da capacidade física, mas de uma vontade indomável.", author: "Mahatma Gandhi", obs: "Líder pacifista" },
    { text: "A melhor vingança é um sucesso estrondoso.", author: "Frank Sinatra", obs: "Cantor e ator" },
    { text: "Se você quer alcançar a grandeza, pare de pedir permissão.", author: "Eddie Colla", obs: "Artista e escritor" },
    { text: "Não espere. O tempo nunca será 'o certo'.", author: "Napoleon Hill", obs: "Autor motivacional" },
    { text: "A confiança vem do preparo.", author: "John Wooden", obs: "Treinador de basquete" },
    { text: "Nada grandioso foi alcançado sem entusiasmo.", author: "Ralph Waldo Emerson", obs: "Filósofo americano" },
    { text: "Aquele que tem um porquê enfrenta qualquer como.", author: "Friedrich Nietzsche", obs: "Filósofo alemão" },
    { text: "Você não precisa ver toda a escada; apenas dê o primeiro passo.", author: "Martin Luther King Jr.", obs: "Líder dos direitos civis" },
    { text: "Faça da sua vida um sonho, e de um sonho, uma realidade.", author: "Antoine de Saint-Exupéry", obs: "Escritor e aviador" },
    { text: "As dificuldades preparam pessoas comuns para destinos extraordinários.", author: "C. S. Lewis", obs: "Escritor britânico" },
    { text: "A ação é a chave fundamental para todo sucesso.", author: "Pablo Picasso", obs: "Pintor espanhol" },
    { text: "Não tenho talentos especiais. Sou apenas apaixonadamente curioso.", author: "Albert Einstein", obs: "Físico teórico" },
    { text: "O fracasso é o condimento que dá sabor ao sucesso.", author: "Truman Capote", obs: "Escritor americano" },
    { text: "Seja você mesmo; todos os outros já existem.", author: "Oscar Wilde", obs: "Escritor irlandês" },
    { text: "O único limite para a nossa realização de amanhã são as nossas dúvidas de hoje.", author: "Franklin D. Roosevelt", obs: "Presidente dos EUA" },
    { text: "Arriscar é perder o equilíbrio por um momento. Não arriscar é perder-se.", author: "Søren Kierkegaard", obs: "Filósofo dinamarquês" },
    { text: "A dor é temporária, o orgulho é para sempre.", author: "Lance Armstrong", obs: "Ciclista americano" },
    { text: "A simplicidade é o último grau de sofisticação.", author: "Leonardo da Vinci", obs: "Gênio renascentista" },
    { text: "Tudo o que a mente do homem pode conceber e acreditar, ela pode alcançar.", author: "Napoleon Hill", obs: "Autor motivacional" },
    { text: "Quem olha para fora sonha; quem olha para dentro desperta.", author: "Carl G. Jung", obs: "Psicanalista suíço" },
    { text: "A maior glória não é nunca cair, mas levantar-se sempre.", author: "Confúcio", obs: "Filósofo chinês" },
    { text: "Você deve ser a própria chama que deseja acender nos outros.", author: "Madre Teresa", obs: "Missionária católica" },
    { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier", obs: "Autor motivacional" },
    { text: "As oportunidades não acontecem. Você as cria.", author: "Chris Grosser", obs: "Empreendedor" },
    { text: "Tudo parece impossível até que seja feito.", author: "Nelson Mandela", obs: "Líder sul-africano" },
    { text: "Nunca é tarde para ser aquilo que você poderia ter sido.", author: "George Eliot", obs: "Romancista inglesa" },
    { text: "A coragem é a primeira das qualidades humanas, porque garante todas as outras.", author: "Aristóteles", obs: "Filósofo grego" },
    { text: "A arte de vencer se aprende nas derrotas.", author: "Simón Bolívar", obs: "Libertador sul-americano" },
    { text: "A imaginação é mais importante que o conhecimento.", author: "Albert Einstein", obs: "Físico teórico" },
    { text: "Não pare quando estiver cansado; pare quando tiver terminado.", author: "Marilyn Monroe", obs: "Atriz americana" },
    { text: "A persistência realiza o impossível.", author: "Provérbio Chinês", obs: "Sabedoria popular" },
    { text: "O único homem que não erra é aquele que nunca faz nada.", author: "Theodore Roosevelt", obs: "Presidente dos EUA" },
    { text: "Foco é dizer não.", author: "Steve Jobs", obs: "Fundador da Apple" },
    { text: "Transforme suas feridas em sabedoria.", author: "Oprah Winfrey", obs: "Apresentadora e empresária" },
    { text: "Se você está atravessando o inferno, continue.", author: "Winston Churchill", obs: "Primeiro-ministro britânico" },
    { text: "O impossível é apenas opinião.", author: "Paulo Coelho", obs: "Escritor brasileiro" },
    { text: "A felicidade não é algo pronto. Ela vem de suas próprias ações.", author: "Dalai Lama", obs: "Líder espiritual tibetano" },
    { text: "A única viagem impossível é aquela que você nunca começa.", author: "Tony Robbins", obs: "Coach motivacional" },
    { text: "Nada diminui tanto a ansiedade quanto a ação.", author: "Walter Anderson", obs: "Autor e editor" },
    { text: "Você é o artista da sua própria vida. Não entregue o pincel a ninguém.", author: "Iva Ursano", obs: "Coach de vida" },
    { text: "Onde há amor e inspiração, nada pode dar errado.", author: "Ella Fitzgerald", obs: "Cantora de jazz" },
    { text: "Crie com o coração; construa com a mente.", author: "Criss Jami", obs: "Escritor e músico" },
    { text: "A felicidade é uma direção, não um lugar.", author: "Sydney J. Harris", obs: "Jornalista" },
    { text: "As cicatrizes nos lembram onde estivemos; não ditam para onde vamos.", author: "David Rossi", obs: "Personagem fictício" },
    { text: "Não tenha medo da perfeição; você nunca a alcançará.", author: "Salvador Dalí", obs: "Pintor surrealista" },
    { text: "A inspiração existe, mas ela precisa encontrar você trabalhando.", author: "Pablo Picasso", obs: "Pintor espanhol" },
    { text: "A vida é o que acontece enquanto você está ocupado fazendo outros planos.", author: "John Lennon", obs: "Músico britânico" },
    { text: "Se quiser resultados diferentes, faça diferente.", author: "Albert Einstein", obs: "Físico teórico" },
    { text: "Viver é a coisa mais rara do mundo. A maioria apenas existe.", author: "Oscar Wilde", obs: "Escritor irlandês" },
    { text: "A vida recompensa a ação, não a intenção.", author: "Paulo Coelho", obs: "Escritor brasileiro" },
    { text: "A coragem não grita; às vezes sussurra: 'tentarei novamente amanhã'.", author: "Mary Anne Radmacher", obs: "Autora motivacional" },
    { text: "A vitória é reservada àqueles que estão dispostos a pagar o preço.", author: "Sun Tzu", obs: "Estrategista chinês" },
    { text: "A paciência é amarga, mas seu fruto é doce.", author: "Jean-Jacques Rousseau", obs: "Filósofo suíço" },
    { text: "A educação é a arma mais poderosa para mudar o mundo.", author: "Nelson Mandela", obs: "Líder sul-africano" },
    { text: "O futuro pertence àqueles que acreditam na beleza de seus sonhos.", author: "Eleanor Roosevelt", obs: "Primeira-dama dos EUA" },
    { text: "O segredo para ir em frente é começar.", author: "Mark Twain", obs: "Escritor americano" },
    { text: "O que fazemos em vida ecoa na eternidade.", author: "Marco Aurélio", obs: "Imperador romano" },
    { text: "Não há caminho para a paz; a paz é o caminho.", author: "Mahatma Gandhi", obs: "Líder pacifista" },
    { text: "A gentileza é uma linguagem que os surdos podem ouvir e os cegos podem ver.", author: "Mark Twain", obs: "Escritor americano" },
    { text: "Feliz aquele que transfere o que sabe e aprende o que ensina.", author: "Cora Coralina", obs: "Poetisa brasileira" },
    { text: "A esperança tem duas filhas: indignação e coragem.", author: "Santo Agostinho", obs: "Teólogo cristão" },
    { text: "Quem sente não é quem quer, mas quem pode.", author: "Machado de Assis", obs: "Escritor brasileiro" },
    { text: "Tudo o que é feito por amor está além do bem e do mal.", author: "Friedrich Nietzsche", obs: "Filósofo alemão" },
    { text: "Nada do que foi será do jeito que já foi um dia.", author: "Lulu Santos", obs: "Cantor e compositor" },
    { text: "Tenho em mim todos os sonhos do mundo.", author: "Fernando Pessoa", obs: "Poeta português" },
    { text: "Tudo vale a pena se a alma não é pequena.", author: "Fernando Pessoa", obs: "Poeta português" },
    { text: "Não existe caminho para a felicidade. A felicidade é o caminho.", author: "Thich Nhat Hanh", obs: "Monge budista" },
    { text: "Para ser insubstituível, é preciso ser diferente.", author: "Coco Chanel", obs: "Estilista francesa" },
    { text: "O futuro começa hoje, não amanhã.", author: "Papa João Paulo II", obs: "Papa católico" },
    { text: "Se quer ir rápido, vá sozinho. Se quer ir longe, vá acompanhado.", author: "Provérbio Africano", obs: "Sabedoria popular" },
    { text: "A mente que se abre a uma nova ideia jamais volta ao seu tamanho original.", author: "Oliver W. Holmes", obs: "Jurista americano" },
    { text: "Não espere por uma crise para descobrir o que é importante em sua vida.", author: "Platão", obs: "Filósofo grego" },
    { text: "A perfeição é alcançada não quando não há mais nada a acrescentar, mas quando não há nada a retirar.", author: "Antoine de Saint-Exupéry", obs: "Escritor e aviador" },
    { text: "O que você busca está buscando você.", author: "Rumi", obs: "Poeta persa" },
    { text: "Levante-se. Comece. E, acima de tudo, nunca desista.", author: "Walt Whitman", obs: "Poeta americano" },
    { text: "A música pode mudar o mundo porque pode mudar as pessoas.", author: "Bono", obs: "Cantor do U2" },
    { text: "O talento vence jogos, mas o trabalho em equipe vence campeonatos.", author: "Michael Jordan", obs: "Jogador de basquete" },
];

export const TZ = "America/Fortaleza";

export function getYYYYMMDDInTZ(date = new Date(), timeZone = TZ) {
    const parts = new Intl.DateTimeFormat("pt-BR", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
        .formatToParts(date)
        .reduce<Record<string, string>>((acc, p) => {
            if (p.type !== "literal") acc[p.type] = p.value;
            return acc;
        }, {});
    return `${parts.year}-${parts.month}-${parts.day}`; // YYYY-MM-DD
}

export function indexForDate(dateStr: string, len: number) {
    let h = 0;
    for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
    return h % len;
}

export function getQuoteOfTheDay(date = new Date(), timeZone = TZ) {
    const dateStr = getYYYYMMDDInTZ(date, timeZone);
    const idx = indexForDate(dateStr, QUOTES.length);
    const q = QUOTES[idx];
    return { date: dateStr, ...q };
}