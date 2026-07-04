/// Dados fictícios do protótipo (Fase 0 — validação comercial).
library;

import 'models.dart';

const demoUser = UserProfile(
  name: 'Bruno',
  streakDays: 14,
  totalPoints: 186.5,
  totalKm: 172.4,
  badges: ['7 dias', '14 dias', 'Primeira causa', '100 pontos'],
  leagueCode: 'ACME2026',
);

const causes = [
  Cause(
    id: 'c-001',
    name: 'Educação em Movimento',
    ngo: 'Fundação Esperança',
    sponsor: 'ACME S.A.',
    emoji: '📚',
    description:
        'Cada ponto de impacto ajuda a financiar aulas de reforço escolar para '
        'crianças da rede pública. A verba é destravada pelo esforço coletivo '
        'dos participantes: 25% da meta libera o primeiro repasse.',
    goalPoints: 50000,
    currentPoints: 31450,
    budgetBrl: 50000,
  ),
  Cause(
    id: 'c-002',
    name: 'Passos pela Mata Atlântica',
    ngo: 'Instituto Raiz Verde',
    sponsor: 'Verde Bank',
    emoji: '🌳',
    description:
        'A comunidade caminha e o patrocinador planta: a cada 100 pontos, uma '
        'muda nativa é plantada em áreas de restauração da Mata Atlântica.',
    goalPoints: 80000,
    currentPoints: 12300,
    budgetBrl: 30000,
  ),
  Cause(
    id: 'c-003',
    name: 'Km do Bem — Saúde da Mulher',
    ngo: 'Coletivo Amanhã',
    sponsor: 'Farma Mais',
    emoji: '🎗️',
    description:
        'Campanha de outubro: quilômetros validados financiam exames '
        'preventivos em comunidades sem acesso à rede de saúde.',
    goalPoints: 40000,
    currentPoints: 38900,
    budgetBrl: 45000,
  ),
];

const challenges = [
  Challenge(
    id: 'ch-001',
    title: 'Desafio 21 dias de constância',
    metric: 'Streak diário',
    durationDays: 21,
    reward: 'Badge Ouro + 50 pts bônus',
    participants: 842,
    joined: true,
    endsIn: Duration(days: 9),
  ),
  Challenge(
    id: 'ch-002',
    title: '100 km em um mês',
    metric: 'Distância',
    durationDays: 30,
    reward: 'Cupom 20% loja parceira',
    participants: 1267,
    joined: false,
    endsIn: Duration(days: 18),
  ),
  Challenge(
    id: 'ch-003',
    title: 'Semana 70k passos',
    metric: 'Passos',
    durationDays: 7,
    reward: 'Badge + destaque no ranking',
    participants: 3021,
    joined: false,
    endsIn: Duration(days: 3),
  ),
];

const leagueLeaderboard = [
  LeaderboardEntry(rank: 1, name: 'Marina L.', points: 312.0, team: 'Marketing'),
  LeaderboardEntry(rank: 2, name: 'João S.', points: 298.5, team: 'Engenharia'),
  LeaderboardEntry(rank: 3, name: 'Time Vendas', points: 4200.0, team: 'Vendas'),
  LeaderboardEntry(rank: 4, name: 'Bruno', points: 186.5, isMe: true, team: 'Produto'),
  LeaderboardEntry(rank: 5, name: 'Carla M.', points: 154.0, team: 'RH'),
  LeaderboardEntry(rank: 6, name: 'Pedro A.', points: 131.2, team: 'Financeiro'),
];
