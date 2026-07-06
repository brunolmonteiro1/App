/// Estado central do app com persistência local (shared_preferences).
///
/// Substitui os valores estáticos do protótipo: nome do usuário, causa ativa,
/// desafios inscritos, liga, treinos registrados e streak passam a ser reais,
/// sobrevivem ao fechamento do app e alimentam Home, Ranking e Perfil.
library;

import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'models.dart';

class WorkoutSession {
  const WorkoutSession({
    required this.type,
    required this.startedAt,
    required this.durationSec,
    required this.steps,
    required this.distanceKm,
    required this.points,
  });

  final ActivityType type;
  final DateTime startedAt;
  final int durationSec;
  final int steps;
  final double distanceKm;
  final double points;

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'startedAt': startedAt.toIso8601String(),
        'durationSec': durationSec,
        'steps': steps,
        'distanceKm': distanceKm,
        'points': points,
      };

  factory WorkoutSession.fromJson(Map<String, dynamic> j) => WorkoutSession(
        type: ActivityType.values.firstWhere((t) => t.name == j['type'],
            orElse: () => ActivityType.outdoorWalk),
        startedAt: DateTime.parse(j['startedAt'] as String),
        durationSec: (j['durationSec'] as num).toInt(),
        steps: (j['steps'] as num).toInt(),
        distanceKm: (j['distanceKm'] as num).toDouble(),
        points: (j['points'] as num).toDouble(),
      );
}

class AppState extends ChangeNotifier {
  AppState._(this._prefs);

  final SharedPreferences _prefs;

  static Future<AppState> load() async {
    final prefs = await SharedPreferences.getInstance();
    final s = AppState._(prefs);
    s._userName = prefs.getString('userName') ?? 'Você';
    s._onboarded = prefs.getBool('onboarded') ?? false;
    s._activeCauseId = prefs.getString('activeCauseId');
    s._leagueCode = prefs.getString('leagueCode');
    s._joinedChallenges =
        (prefs.getStringList('joinedChallenges') ?? const []).toSet();
    final raw = prefs.getString('sessions');
    if (raw != null) {
      s._sessions = (jsonDecode(raw) as List)
          .map((e) => WorkoutSession.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return s;
  }

  String _userName = 'Você';
  bool _onboarded = false;
  String? _activeCauseId;
  String? _leagueCode;
  Set<String> _joinedChallenges = {};
  List<WorkoutSession> _sessions = [];

  String get userName => _userName;
  bool get onboarded => _onboarded;
  String? get activeCauseId => _activeCauseId;
  String? get leagueCode => _leagueCode;
  Set<String> get joinedChallenges => _joinedChallenges;
  List<WorkoutSession> get sessions => List.unmodifiable(_sessions);

  // ---- Totais derivados dos treinos reais ----

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  Iterable<WorkoutSession> get _todaySessions =>
      _sessions.where((s) => _sameDay(s.startedAt, DateTime.now()));

  int get todaySteps => _todaySessions.fold(0, (t, s) => t + s.steps);
  double get todayKm => _todaySessions.fold(0.0, (t, s) => t + s.distanceKm);
  double get todayPoints => _todaySessions.fold(0.0, (t, s) => t + s.points);

  double get totalPoints => _sessions.fold(0.0, (t, s) => t + s.points);
  double get totalKm => _sessions.fold(0.0, (t, s) => t + s.distanceKm);

  /// Dias consecutivos (terminando hoje ou ontem) com pelo menos um treino.
  int get streakDays {
    if (_sessions.isEmpty) return 0;
    final days = _sessions
        .map((s) =>
            DateTime(s.startedAt.year, s.startedAt.month, s.startedAt.day))
        .toSet();
    var cursor = DateTime.now();
    cursor = DateTime(cursor.year, cursor.month, cursor.day);
    if (!days.contains(cursor)) {
      cursor = cursor.subtract(const Duration(days: 1));
      if (!days.contains(cursor)) return 0;
    }
    var streak = 0;
    while (days.contains(cursor)) {
      streak++;
      cursor = cursor.subtract(const Duration(days: 1));
    }
    return streak;
  }

  /// Conquistas derivadas do uso real.
  List<String> get badges => [
        if (_sessions.isNotEmpty) 'Primeiro treino',
        if (streakDays >= 7) '7 dias',
        if (streakDays >= 14) '14 dias',
        if (_activeCauseId != null) 'Primeira causa',
        if (totalPoints >= 100) '100 pontos',
      ];

  // ---- Mutations (todas persistem) ----

  Future<void> _save() async {
    await _prefs.setString('userName', _userName);
    await _prefs.setBool('onboarded', _onboarded);
    _activeCauseId == null
        ? await _prefs.remove('activeCauseId')
        : await _prefs.setString('activeCauseId', _activeCauseId!);
    _leagueCode == null
        ? await _prefs.remove('leagueCode')
        : await _prefs.setString('leagueCode', _leagueCode!);
    await _prefs.setStringList('joinedChallenges', _joinedChallenges.toList());
    await _prefs.setString(
        'sessions', jsonEncode(_sessions.map((s) => s.toJson()).toList()));
  }

  void completeOnboarding() {
    _onboarded = true;
    _save();
    notifyListeners();
  }

  void setUserName(String name) {
    if (name.trim().isEmpty) return;
    _userName = name.trim();
    _save();
    notifyListeners();
  }

  void setActiveCause(String causeId) {
    _activeCauseId = causeId;
    _save();
    notifyListeners();
  }

  void toggleChallenge(String id) {
    _joinedChallenges.contains(id)
        ? _joinedChallenges.remove(id)
        : _joinedChallenges.add(id);
    _save();
    notifyListeners();
  }

  void joinLeague(String code) {
    _leagueCode = code.trim().toUpperCase();
    _save();
    notifyListeners();
  }

  void leaveLeague() {
    _leagueCode = null;
    _save();
    notifyListeners();
  }

  void addSession(WorkoutSession session) {
    _sessions = [..._sessions, session];
    _save();
    notifyListeners();
  }

  /// Zera os dados do usuário (mantém o conteúdo de exemplo das campanhas).
  Future<void> resetAll() async {
    _userName = 'Você';
    _activeCauseId = null;
    _leagueCode = null;
    _joinedChallenges = {};
    _sessions = [];
    await _save();
    notifyListeners();
  }
}
