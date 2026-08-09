import 'package:flutter_test/flutter_test.dart';
import 'package:norton_app/data/app_state.dart';
import 'package:norton_app/data/models.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<AppState> freshState() async {
    SharedPreferences.setMockInitialValues({});
    return AppState.load();
  }

  WorkoutSession session({DateTime? at, double km = 2, int steps = 2500}) =>
      WorkoutSession(
        type: ActivityType.outdoorWalk,
        startedAt: at ?? DateTime.now(),
        durationSec: 1200,
        steps: steps,
        distanceKm: km,
        points: impactPointsFor(ActivityType.outdoorWalk, km: km),
      );

  test('treino soma pontos, km e passos de hoje', () async {
    final s = await freshState();
    s.addSession(session(km: 3, steps: 4000));
    expect(s.todayKm, 3);
    expect(s.todaySteps, 4000);
    expect(s.todayPoints, 3);
    expect(s.totalPoints, 3);
  });

  test('streak conta dias consecutivos com treino', () async {
    final s = await freshState();
    final now = DateTime.now();
    s.addSession(session(at: now));
    s.addSession(session(at: now.subtract(const Duration(days: 1))));
    s.addSession(session(at: now.subtract(const Duration(days: 2))));
    // buraco no dia -3, treino no dia -4 não conta para o streak
    s.addSession(session(at: now.subtract(const Duration(days: 4))));
    expect(s.streakDays, 3);
  });

  test('estado persiste entre "aberturas" do app', () async {
    SharedPreferences.setMockInitialValues({});
    final s1 = await AppState.load();
    s1.setUserName('Bruno');
    s1.joinLeague('acme2026');
    s1.toggleChallenge('ch-001');
    s1.setActiveCause('c-002');
    s1.addSession(session());
    // aguarda os saves assíncronos
    await Future<void>.delayed(const Duration(milliseconds: 50));

    final s2 = await AppState.load();
    expect(s2.userName, 'Bruno');
    expect(s2.leagueCode, 'ACME2026');
    expect(s2.joinedChallenges, contains('ch-001'));
    expect(s2.activeCauseId, 'c-002');
    expect(s2.sessions.length, 1);
  });

  test('badges derivam do uso real', () async {
    final s = await freshState();
    expect(s.badges, isEmpty);
    s.addSession(session());
    s.setActiveCause('c-001');
    expect(s.badges, containsAll(['Primeiro treino', 'Primeira causa']));
  });
}
