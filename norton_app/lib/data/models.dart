/// Modelos centrais do Norton Impact.
///
/// `ActivityRecord` espelha o schema definido no blueprint
/// (docs/02-blueprint-desenvolvimento.md): registro interno e source-agnostic
/// de toda atividade, qualquer que seja a fonte.
library;

enum ActivitySourceType { healthConnect, healthKit, gps, manual, admin, mock }

enum ActivityType { indoorWalk, outdoorWalk, outdoorRun, cycling, stepsDaily }

enum ActivityStatus { pending, accepted, flagged, rejected, adjusted }

class ActivityRecord {
  const ActivityRecord({
    required this.id,
    required this.userId,
    required this.source,
    required this.activityType,
    required this.startedAt,
    required this.endedAt,
    required this.rawSourceId,
    this.campaignId,
    this.distanceKm = 0,
    this.steps = 0,
    this.durationSec = 0,
    this.status = ActivityStatus.pending,
    this.impactPoints = 0,
    this.validationFlags = const [],
  });

  final String id;
  final String userId;
  final String? campaignId;
  final ActivitySourceType source;
  final ActivityType activityType;
  final DateTime startedAt;
  final DateTime endedAt;
  final double distanceKm;
  final int steps;
  final int durationSec;

  /// Chave de deduplicação: reimportar a mesma atividade nunca conta duas vezes.
  final String rawSourceId;
  final ActivityStatus status;
  final double impactPoints;
  final List<String> validationFlags;
}

/// Tabela de conversão em Pontos de Impacto (parametrizável por campanha
/// no produto real; fixa no protótipo).
double impactPointsFor(ActivityType type, {double km = 0, int minutes = 0}) {
  switch (type) {
    case ActivityType.indoorWalk:
    case ActivityType.outdoorWalk:
    case ActivityType.outdoorRun:
    case ActivityType.stepsDaily:
      return km * 1.0;
    case ActivityType.cycling:
      return km * 0.25;
  }
}

class Cause {
  const Cause({
    required this.id,
    required this.name,
    required this.ngo,
    required this.sponsor,
    required this.description,
    required this.goalPoints,
    required this.currentPoints,
    required this.budgetBrl,
    required this.emoji,
  });

  final String id;
  final String name;
  final String ngo;
  final String sponsor;
  final String description;
  final double goalPoints;
  final double currentPoints;

  /// Verba fechada da campanha — liberada por marcos (25/50/100%).
  final double budgetBrl;
  final String emoji;

  double get progress => (currentPoints / goalPoints).clamp(0, 1);

  /// Valor já destravado segundo os marcos de liberação.
  double get unlockedBrl {
    if (progress >= 1.0) return budgetBrl;
    if (progress >= 0.5) return budgetBrl * 0.5;
    if (progress >= 0.25) return budgetBrl * 0.25;
    return 0;
  }
}

class Challenge {
  const Challenge({
    required this.id,
    required this.title,
    required this.metric,
    required this.durationDays,
    required this.reward,
    required this.participants,
    required this.joined,
    required this.endsIn,
  });

  final String id;
  final String title;
  final String metric;
  final int durationDays;
  final String reward;
  final int participants;
  final bool joined;
  final Duration endsIn;
}

class LeaderboardEntry {
  const LeaderboardEntry({
    required this.rank,
    required this.name,
    required this.points,
    this.isMe = false,
    this.team,
  });

  final int rank;
  final String name;
  final double points;
  final bool isMe;
  final String? team;
}

class UserProfile {
  const UserProfile({
    required this.name,
    required this.streakDays,
    required this.totalPoints,
    required this.totalKm,
    required this.badges,
    this.leagueCode,
  });

  final String name;
  final int streakDays;
  final double totalPoints;
  final double totalKm;
  final List<String> badges;
  final String? leagueCode;
}
