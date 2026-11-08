import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ChevronDown, ChevronUp, BookOpen, Users, Calendar, Landmark } from "lucide-react"

// ── Data ───────────────────────────────────────────────────────────────────

interface WikiEntry {
  id: string
  title: string
  period: string
  periodColor: string
  year: string
  summary: string
  details: string[]
  figures?: string[]
  type: 'evento' | 'figura' | 'movimento' | 'lei'
}

const PERIODS = ['Todos', 'Pré-Colonial', 'Colonial', 'Império', 'República Velha', 'Era Vargas', 'Ditadura', 'Redemocratização']

const PERIOD_COLORS: Record<string, string> = {
  'Pré-Colonial':     'bg-emerald-900/40 border-emerald-600/60 text-emerald-300',
  'Colonial':         'bg-amber-900/40 border-amber-600/60 text-amber-300',
  'Império':          'bg-purple-900/40 border-purple-600/60 text-purple-300',
  'República Velha':  'bg-blue-900/40 border-blue-600/60 text-blue-300',
  'Era Vargas':       'bg-orange-900/40 border-orange-600/60 text-orange-300',
  'Ditadura':         'bg-red-900/40 border-red-600/60 text-red-300',
  'Redemocratização': 'bg-cyan-900/40 border-cyan-600/60 text-cyan-300',
}

const ENTRIES: WikiEntry[] = [
  // PRÉ-COLONIAL
  {
    id: 'indigenas', type: 'evento',
    title: 'Povos Indígenas do Brasil', period: 'Pré-Colonial', periodColor: 'emerald', year: 'Antes de 1500',
    summary: 'Antes da chegada dos europeus, o Brasil abrigava entre 2 e 5 milhões de indígenas, organizados em centenas de etnias com línguas, culturas e cosmologias próprias.',
    details: [
      'Os dois principais troncos linguísticos eram o Tupi (litoral) e o Macro-Jê (planalto central).',
      'Os Tupi organizavam-se em aldeias (tabas) lideradas por caciques, com pajés como líderes espirituais.',
      'A espiritualidade era central: Tupã (deus do trovão), Jurupari (espírito maligno) e a crença na Terra Sem Males (Yby Marã Eỹ).',
      'A cerâmica marajoara (Ilha de Marajó, PA) demonstra sofisticação artística de povos pré-coloniais.',
      'Muitas palavras do português brasileiro vêm do Tupi: abacaxi, jaguar, mandioca, pipoca, caju, capim.',
    ],
    figures: ['Tupã (divindade)', 'Pajés (líderes espirituais)', 'Caciques (líderes políticos)'],
  },
  // COLONIAL
  {
    id: 'chegada', type: 'evento',
    title: 'Chegada dos Portugueses (1500)', period: 'Colonial', periodColor: 'amber', year: '1500',
    summary: 'Em 22 de abril de 1500, Pedro Álvares Cabral chegou ao Brasil com uma frota de 13 navios. O escrivão Pero Vaz de Caminha documentou o encontro na famosa carta ao rei D. Manuel I.',
    details: [
      'O Brasil foi chamado inicialmente de "Ilha de Vera Cruz" e depois "Terra de Santa Cruz".',
      'O nome "Brasil" veio do pau-brasil, madeira usada para tingir tecidos na Europa.',
      'O primeiro contato com os Tupinambá foi pacífico, mas a situação deteriorou com a colonização.',
      'A carta de Pero Vaz de Caminha é o documento mais antigo sobre o Brasil — descreveu a terra, os índios e pediu padres para catequizá-los.',
    ],
    figures: ['Pedro Álvares Cabral', 'Pero Vaz de Caminha', 'Nicolau Coelho'],
  },
  {
    id: 'pau-brasil', type: 'evento',
    title: 'Ciclo do Pau-Brasil', period: 'Colonial', periodColor: 'amber', year: '1500–1530',
    summary: 'A madeira avermelhada foi a primeira riqueza explorada. Os indígenas trabalhavam no sistema de escambo, recebendo objetos europeus (machados, espelhos) em troca do trabalho.',
    details: [
      'O pau-brasil (Caesalpinia echinata) produz um corante vermelho-sangue valioso na Europa.',
      'O escambo substituiu a força inicialmente — os índios derrubavam e carregavam os troncos.',
      'A exploração predatória levou à quase extinção da espécie e destruiu ecossistemas litorâneos.',
      'Comerciantes franceses também exploravam o pau-brasil, gerando conflitos com Portugal.',
    ],
  },
  {
    id: 'capitanias', type: 'evento',
    title: 'Capitanias Hereditárias', period: 'Colonial', periodColor: 'amber', year: '1534',
    summary: 'D. João III dividiu o Brasil em 14 capitanias para colonizá-lo sem custos para a coroa. Donatários nobres recebiam terras em troca de colonizar e defender.',
    details: [
      'Das 14 capitanias, apenas Pernambuco (Duarte Coelho) e São Vicente (Martim Afonso) prosperaram.',
      'Em 1549, o sistema falhou e foi criado o Governo-Geral com Tomé de Sousa como 1º governador.',
      'Salvador foi fundada em 1549 como primeira capital do Brasil.',
      'Os jesuítas chegaram com Tomé de Sousa para catequizar os indígenas.',
    ],
    figures: ['Martim Afonso de Sousa', 'Duarte Coelho', 'Tomé de Sousa'],
  },
  {
    id: 'escravidao', type: 'evento',
    title: 'Escravidão Africana no Brasil', period: 'Colonial', periodColor: 'amber', year: '1549–1888',
    summary: 'O Brasil foi o maior importador de africanos escravizados do mundo. Entre 4 e 5 milhões de africanos foram trazidos ao longo de três séculos — 40% de todo o tráfico atlântico.',
    details: [
      'A escravidão indígena foi gradualmente substituída pela africana a partir de 1549, com a expansão do açúcar.',
      'Os africanos vinham principalmente de Angola, Congo, Golfo do Benim e Moçambique.',
      'O Quilombo dos Palmares (AL), liderado por Zumbi, durou quase 100 anos e tinha ~20 mil habitantes.',
      'Zumbi foi morto em 20 de novembro de 1695 — hoje é o Dia da Consciência Negra.',
      'A Lei Eusébio de Queirós (1850) proibiu o tráfico, mas a escravidão interna continuou até 1888.',
      'A cultura africana moldou profundamente o Brasil: candomblé, capoeira, samba, culinária.',
    ],
    figures: ['Zumbi dos Palmares', 'Dandara', 'José do Patrocínio', 'Joaquim Nabuco'],
  },
  {
    id: 'holandeses', type: 'evento',
    title: 'Invasão Holandesa (1630–1654)', period: 'Colonial', periodColor: 'amber', year: '1630–1654',
    summary: 'A Companhia das Índias Ocidentais (WIC) ocupou o Nordeste brasileiro por 24 anos. O governador Maurício de Nassau modernizou a região com tolerância religiosa e investimentos culturais.',
    details: [
      'Os holandeses controlaram o açúcar mais lucrativo do mundo durante a ocupação.',
      'Maurício de Nassau construiu pontes, jardins botânicos e trouxe pintores (Frans Post, Albert Eckhout).',
      'A Insurreição Pernambucana (1645) foi liderada por João Fernandes Vieira, Henrique Dias e Felipe Camarão.',
      'Os holandeses foram expulsos em 1654 na Batalha de Guararapes.',
    ],
    figures: ['Maurício de Nassau', 'João Fernandes Vieira', 'Henrique Dias (soldado negro)', 'Felipe Camarão (indígena)'],
  },
  // IMPÉRIO
  {
    id: 'familia-real', type: 'evento',
    title: 'Vinda da Família Real (1808)', period: 'Império', periodColor: 'purple', year: '1808',
    summary: 'Fugindo de Napoleão, D. João VI transferiu toda a corte portuguesa (15 mil pessoas) para o Rio de Janeiro em 1808, transformando o Brasil de colônia em sede do Império Português.',
    details: [
      'D. João VI abriu os portos às nações amigas em 1808 — fim do exclusivo colonial.',
      'Foram criados: Banco do Brasil, Imprensa Régia, Real Horto (hoje Jardim Botânico) e escolas militares.',
      'A família real ficou no Brasil até 1821, quando D. João VI retornou a Portugal pressionado.',
      'D. Pedro I ficou no Brasil com a missão de "se a hora chegar, proclames a independência".',
    ],
    figures: ['D. João VI', 'D. Carlota Joaquina', 'D. Pedro I'],
  },
  {
    id: 'independencia', type: 'evento',
    title: 'Independência do Brasil (1822)', period: 'Império', periodColor: 'purple', year: '7 set. 1822',
    summary: 'D. Pedro I proclamou a independência às margens do Rio Ipiranga em 7 de setembro de 1822. O Brasil tornou-se o único país das Américas a optar pela monarquia.',
    details: [
      'As Cortes Portuguesas tentaram recolonizar o Brasil, revoltando as elites locais.',
      'José Bonifácio de Andrada e Silva foi o principal articulador da independência.',
      'A batalha de independência mais difícil foi na Bahia, onde tropas portuguesas resistiram até julho de 1823.',
      'D. Pedro I foi coroado imperador em dezembro de 1822.',
      'O grito do Ipiranga foi: "Independência ou Morte!"',
    ],
    figures: ['D. Pedro I', 'José Bonifácio (Patriarca da Independência)', 'Maria Leopoldina'],
  },
  {
    id: 'pedro2', type: 'figura',
    title: 'D. Pedro II — O Grande Imperador', period: 'Império', periodColor: 'purple', year: '1841–1889',
    summary: 'Considerado um dos maiores estadistas brasileiros, D. Pedro II governou por 49 anos e modernizou o país. Era apaixonado por ciências e cultura, falava 14 idiomas.',
    details: [
      'Subiu ao trono com apenas 14 anos, após um golpe que antecipou sua maioridade.',
      'Correspondia-se com Charles Darwin, Victor Hugo, Louis Pasteur e outros intelectuais.',
      'Aboliu a escravidão gradualmente: Lei do Ventre Livre (1871), Lei dos Sexagenários (1885), Lei Áurea (1888).',
      'A Guerra do Paraguai (1864-1870) foi o maior conflito armado da história sul-americana.',
      'Deposto pelo golpe militar em 15 de novembro de 1889, foi para o exílio em Paris, onde morreu em 1891.',
    ],
    figures: ['D. Pedro II', 'Princesa Isabel', 'Conde d\'Eu', 'Teresa Cristina'],
  },
  {
    id: 'lei-aurea', type: 'lei',
    title: 'Lei Áurea — Abolição da Escravatura (1888)', period: 'Império', periodColor: 'purple', year: '13 mai. 1888',
    summary: 'Assinada pela Princesa Isabel em 13 de maio de 1888, a Lei Áurea aboliu a escravidão no Brasil. O país foi o último das Américas a fazê-lo.',
    details: [
      'A lei tinha apenas dois artigos: declarava livre todo escravo e revogava disposições em contrário.',
      'O movimento abolicionista incluiu jornalistas (José do Patrocínio), políticos (Joaquim Nabuco) e artistas.',
      'A abolição sem reforma agrária deixou os ex-escravizados sem terra, trabalho ou reparação.',
      'Os fazendeiros, sem indenização, retiraram o apoio à monarquia e financiaram a República.',
      'Joaquim Nabuco escreveu "O Abolicionismo" (1883), obra fundamental do movimento.',
    ],
    figures: ['Princesa Isabel', 'Joaquim Nabuco', 'José do Patrocínio', 'André Rebouças'],
  },
  // REPÚBLICA VELHA
  {
    id: 'proclamacao-republica', type: 'evento',
    title: 'Proclamação da República (1889)', period: 'República Velha', periodColor: 'blue', year: '15 nov. 1889',
    summary: 'O Marechal Deodoro da Fonseca proclamou a República em 15 de novembro de 1889. A monarquia caiu sem resistência — D. Pedro II foi exilado no mesmo dia.',
    details: [
      'O positivismo de Auguste Comte influenciou os republicanos militares — daí "Ordem e Progresso" na bandeira.',
      'A República Velha (1889-1930) foi dominada pela política do "café com leite" entre SP e MG.',
      'O coronelismo controlava o voto no interior: coronéis manipulavam eleições locais.',
      'A "política dos governadores" de Campos Sales (1898) consolidou o pacto oligárquico.',
    ],
    figures: ['Marechal Deodoro da Fonseca', 'Benjamin Constant', 'Floriano Peixoto'],
  },
  {
    id: 'canudos', type: 'evento',
    title: 'Guerra de Canudos (1896–1897)', period: 'República Velha', periodColor: 'blue', year: '1896–1897',
    summary: 'O arraial de Canudos (BA), com quase 30 mil habitantes e liderado por Antônio Conselheiro, resistiu a quatro expedições militares. Terminou com o massacre de toda a população.',
    details: [
      'Antônio Conselheiro pregava uma religiosidade popular messiânica e criticava o novo governo republicano.',
      'Canudos era a segunda maior cidade da Bahia em número de habitantes.',
      'O governo usou o exército como se fosse uma ameaça monarquista — era, na verdade, uma revolta de pobres.',
      'Euclides da Cunha cobriu o conflito como jornalista e escreveu "Os Sertões" (1902) — clássico da literatura.',
      'O arraial foi destruído e seus sobreviventes executados em outubro de 1897.',
    ],
    figures: ['Antônio Conselheiro', 'Euclides da Cunha', 'General Arthur Oscar'],
  },
  {
    id: 'revolta-vacina', type: 'evento',
    title: 'Revolta da Vacina (1904)', period: 'República Velha', periodColor: 'blue', year: '1904',
    summary: 'A vacinação obrigatória contra varíola imposta por Oswaldo Cruz gerou uma semana de revoltas no Rio de Janeiro. Bondes derrubados, postes quebrados, tiroteios nas ruas.',
    details: [
      'Oswaldo Cruz foi o diretor de Saúde Pública que também erradicou a febre amarela do Rio.',
      'A população reagiu por falta de informação, medo e memória da epidemia de cólera de 1891.',
      'A revolta foi debelada pelo governo, mas a vacinação obrigatória foi suspensa temporariamente.',
      'O episódio expôs o abismo entre a elite política e as classes populares da Primeira República.',
    ],
    figures: ['Oswaldo Cruz', 'Rodrigues Alves (presidente)'],
  },
  {
    id: 'semana-arte', type: 'movimento',
    title: 'Semana de Arte Moderna (1922)', period: 'República Velha', periodColor: 'blue', year: 'fev. 1922',
    summary: 'Realizada no Teatro Municipal de São Paulo em fevereiro de 1922, a Semana revolucionou a cultura brasileira ao romper com os padrões europeus e buscar uma identidade nacional.',
    details: [
      'Artistas apresentaram obras vanguardistas que chocaram o público conservador.',
      'Tarsila do Amaral pintou obras icônicas como "Abaporu" (1928) e "Operários" (1933).',
      'Oswald de Andrade lançou o "Manifesto Antropofágico": devorar o que vem de fora e transformar em coisa nossa.',
      'Mário de Andrade escreveu "Macunaíma" (1928), herói sem nenhum caráter — símbolo do brasileiro.',
      'Heitor Villa-Lobos levou a música popular brasileira às salas de concerto erudito.',
    ],
    figures: ['Tarsila do Amaral', 'Oswald de Andrade', 'Mário de Andrade', 'Anita Malfatti', 'Heitor Villa-Lobos'],
  },
  // ERA VARGAS
  {
    id: 'vargas', type: 'figura',
    title: 'Era Vargas (1930–1954)', period: 'Era Vargas', periodColor: 'orange', year: '1930–1954',
    summary: 'Getúlio Vargas governou o Brasil por 15 anos em dois períodos. Criou a CLT, o salário mínimo e a Petrobrás. Seu suicídio em 1954 marcou uma das cenas mais dramáticas da política brasileira.',
    details: [
      'Vargas chegou ao poder pela Revolução de 1930, encerrando a República Velha.',
      'O Estado Novo (1937-1945) foi um regime ditatorial inspirado no fascismo europeu.',
      'A CLT (1943) unificou leis trabalhistas: férias, FGTS, décimo terceiro e jornada de 8h.',
      'A Petrobrás foi criada em 1953 sob o slogan "O petróleo é nosso".',
      'Carta-Testamento ao suicidar-se: "Saio da vida para entrar na História".',
    ],
    figures: ['Getúlio Vargas', 'Oswaldo Aranha', 'Gustavo Capanema'],
  },
  // DITADURA
  {
    id: 'golpe-64', type: 'evento',
    title: 'Golpe Militar de 1964', period: 'Ditadura', periodColor: 'red', year: '31 mar. 1964',
    summary: 'Em 31 de março de 1964, um golpe militar depôs o presidente João Goulart. Os militares governaram o Brasil por 21 anos (1964-1985) com censura, tortura e perseguição política.',
    details: [
      'O golpe contou com apoio de empresários, Igreja Católica conservadora e EUA (Guerra Fria).',
      'O AI-5 (1968) foi o momento mais duro: fechou o Congresso, suspendeu direitos e instaurou censura total.',
      'A Guerrilha do Araguaia (1972-1974) foi a principal resistência armada, completamente exterminada.',
      'Artistas como Caetano Veloso, Gilberto Gil e Chico Buarque foram censurados e/ou exilados.',
      'O "Milagre Econômico" (1969-1973): crescimento de 10% ao ano mascarava a repressão.',
    ],
    figures: ['Humberto Castelo Branco', 'Emílio Garrastazu Médici', 'Carlos Marighella', 'Araguaia (guerrilheiros)'],
  },
  {
    id: 'diretas-ja', type: 'movimento',
    title: 'Diretas Já (1984)', period: 'Redemocratização', periodColor: 'cyan', year: '1984',
    summary: 'Em 1984, milhões de brasileiros foram às ruas pedindo eleições diretas para presidente. Foi a maior mobilização popular da história do Brasil.',
    details: [
      'O movimento teve comícios com mais de 1 milhão de pessoas em São Paulo e Rio de Janeiro.',
      'A Emenda Dante de Oliveira foi rejeitada por 22 votos na Câmara — faltou pouco.',
      'Mesmo sem eleição direta, a pressão popular levou à eleição indireta de Tancredo Neves (1985).',
      'Tancredo morreu antes de assumir; José Sarney governou na transição.',
    ],
    figures: ['Ulysses Guimarães', 'Dante de Oliveira', 'Tancredo Neves', 'Lula', 'Fafá de Belém'],
  },
  {
    id: 'constituicao-88', type: 'lei',
    title: 'Constituição Federal de 1988', period: 'Redemocratização', periodColor: 'cyan', year: '5 out. 1988',
    summary: 'Chamada "Constituição Cidadã" por Ulysses Guimarães, garantiu direitos fundamentais e criou o SUS, Estatuto da Criança e mecanismos de participação popular.',
    details: [
      'Promulgada em 5 de outubro de 1988, tem 250 artigos e é uma das mais completas do mundo.',
      'Criou o SUS (Sistema Único de Saúde) — saúde como direito universal e gratuito.',
      'Garantiu o voto para analfabetos e reduziu a maioridade eleitoral para 16 anos.',
      'O Estatuto da Criança e do Adolescente (ECA) foi criado com base na Constituição.',
      'Ulysses Guimarães, presidente da Assembleia Constituinte, disse ao promulgá-la: "A Constituição é a alma da Nação".',
    ],
    figures: ['Ulysses Guimarães', 'Fernando Henrique Cardoso', 'Mário Covas'],
  },
  {
    id: 'plano-real', type: 'evento',
    title: 'Plano Real (1994)', period: 'Redemocratização', periodColor: 'cyan', year: '1994',
    summary: 'O Plano Real criou a moeda Real e controlou a hiperinflação que chegou a 2.477% em 1993. Transformou a vida dos brasileiros e levou FHC à presidência.',
    details: [
      'A hiperinflação corroía salários diariamente — supermercados mudavam etiquetas de preços todo dia.',
      'O Plano foi criado pelo ministro Fernando Henrique Cardoso (FHC), que depois se elegeu presidente.',
      'A URV (Unidade Real de Valor) foi um passo intermediário antes da moeda Real.',
      'O Real foi ancorado ao dólar inicialmente (1 Real = 1 Dólar), dando estabilidade.',
      'O sucesso do plano elegeu FHC em 1994, que governou até 2002.',
    ],
    figures: ['Fernando Henrique Cardoso', 'Itamar Franco', 'Pedro Malan'],
  },
]

// ── Components ─────────────────────────────────────────────────────────────

const TYPE_ICONS = {
  evento: Calendar,
  figura: Users,
  movimento: Landmark,
  lei: BookOpen,
}
const TYPE_LABELS = { evento: 'Evento', figura: 'Figura', movimento: 'Movimento', lei: 'Lei/Documento' }

function EntryCard({ entry }: { entry: WikiEntry }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = TYPE_ICONS[entry.type]
  const periodCls = PERIOD_COLORS[entry.period] || 'bg-gray-900/40 border-gray-600/60 text-gray-300'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-(--color-card) border-[3px] border-(--color-night) shadow-[4px_4px_0_#0F2226] rounded-3xl overflow-hidden hover:-translate-y-0.5 transition-all border-l-[10px] ${
        entry.periodColor === 'emerald' ? 'border-l-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]' :
        entry.periodColor === 'amber' ? 'border-l-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]' :
        entry.periodColor === 'purple' ? 'border-l-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]' :
        entry.periodColor === 'blue' ? 'border-l-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]' :
        entry.periodColor === 'orange' ? 'border-l-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]' :
        entry.periodColor === 'red' ? 'border-l-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]' :
        entry.periodColor === 'cyan' ? 'border-l-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]' :
        'border-l-gray-500'
      }`}>

      <button className="w-full text-left p-5 md:p-6" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-11 h-11 rounded-2xl bg-(--color-background) border-2 border-(--color-border) flex items-center justify-center">
            <Icon size={20} className="text-gray-400" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-xl border ${periodCls}`}>
                {entry.period}
              </span>
              <span className="text-xs font-bold text-gray-500">{TYPE_LABELS[entry.type]}</span>
              <span className="text-xs font-bold text-gray-600 ml-auto">{entry.year}</span>
            </div>
            <h3 className="text-lg font-black text-white leading-tight">{entry.title}</h3>
            <p className="text-gray-400 text-sm font-bold mt-1.5 leading-relaxed line-clamp-2">{entry.summary}</p>
          </div>
          <div className="shrink-0 text-gray-500 mt-1">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden">
            <div className="px-5 md:px-6 pb-5 md:pb-6 border-t-2 border-(--color-border) pt-4 space-y-4">
              {/* Details */}
              <ul className="space-y-2.5">
                {entry.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300 font-bold">
                    <span className="text-yellow-400 mt-0.5 shrink-0">▸</span>
                    <span className="leading-relaxed">{d}</span>
                  </li>
                ))}
              </ul>
              {/* Key figures */}
              {entry.figures && entry.figures.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Figuras Principais</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.figures.map(f => (
                      <span key={f} className="text-xs font-black bg-(--color-background) border border-(--color-border) px-3 py-1.5 rounded-xl text-gray-300">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export function Wiki() {
  const [search, setSearch] = useState('')
  const [activePeriod, setActivePeriod] = useState('Todos')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ENTRIES.filter(e => {
      const matchPeriod = activePeriod === 'Todos' || e.period === activePeriod
      const matchSearch = !q
        || e.title.toLowerCase().includes(q)
        || e.summary.toLowerCase().includes(q)
        || e.details.some(d => d.toLowerCase().includes(q))
        || e.figures?.some(f => f.toLowerCase().includes(q))
      return matchPeriod && matchSearch
    })
  }, [search, activePeriod])

  return (
    <div className="flex flex-col gap-6 w-full max-w-[720px] mx-auto pb-24">

      {/* Header */}
      <div className="text-center pt-2 pb-1">
        <h1 className="font-display text-3xl md:text-4xl text-white mb-2 [text-shadow:4px_4px_0_#0F2226]">
          Wiki <span className="text-(--color-secondary)">Histórica</span>
        </h1>
        <p className="text-white/85 font-medium text-sm md:text-base max-w-md mx-auto">
          História do Brasil de ponta a ponta — do pré-colonial até a Nova República
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-mute)" strokeWidth={2.5} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar personagem, evento, lei..."
          className="w-full bg-(--color-paper) border-[3px] border-(--color-night) shadow-[4px_4px_0_#0F2226] pl-11 pr-5 py-3.5 rounded-2xl text-sm font-semibold text-(--color-night) placeholder:text-(--color-mute) outline-none focus:bg-white transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-(--color-mute) hover:text-(--color-night)">
            ✕
          </button>
        )}
      </div>

      {/* Period filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {PERIODS.map(p => (
          <button key={p} onClick={() => setActivePeriod(p)}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-widest border-[3px] border-(--color-night) transition-all ${
              activePeriod === p
                ? 'bg-(--color-secondary) text-(--color-night) shadow-[3px_3px_0_#0F2226]'
                : 'bg-(--color-paper) text-(--color-night) hover:bg-(--color-chart)'
            }`}>
            {p}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs font-mono text-white/75 uppercase tracking-widest -mt-2">
        {filtered.length} {filtered.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
      </p>

      {/* Entries */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/80">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-black text-lg">Nenhum resultado encontrado.</p>
            <p className="font-bold text-sm mt-1">Tente outra palavra-chave ou período.</p>
          </div>
        ) : (
          filtered.map(e => <EntryCard key={e.id} entry={e} />)
        )}
      </div>

      {/* Footer note */}
      <div className="bg-(--color-card) border-[3px] border-(--color-night) shadow-[4px_4px_0_#0F2226] rounded-2xl p-4 text-center">
        <p className="text-xs font-bold text-gray-500">
          📚 Conteúdo baseado em fontes históricas verificadas · IFRS Farroupilha · HistLingo TCC 2026
        </p>
      </div>
    </div>
  )
}
