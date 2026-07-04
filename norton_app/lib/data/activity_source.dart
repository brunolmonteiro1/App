/// Camada de captura de atividade.
///
/// No produto real, `HealthActivitySource` implementará esta interface usando o
/// pacote `health` (Health Connect no Android, HealthKit no iOS) e
/// `GpsActivitySource` usará `geolocator` para treinos ativos — sem alterar
/// nenhuma tela. O protótipo usa apenas o mock.
library;

import 'models.dart';

abstract class ActivitySource {
  /// Fonte desta implementação (para auditoria no ActivityRecord).
  ActivitySourceType get sourceType;

  /// Pede consentimento/permissões ao usuário. Retorna true se concedido.
  Future<bool> requestPermissions();

  /// Lê as atividades do período — já deduplicadas por rawSourceId.
  Future<List<ActivityRecord>> fetchActivities(DateTime from, DateTime to);
}

/// Implementação fictícia para o protótipo navegável (Fase 0).
class MockActivitySource implements ActivitySource {
  @override
  ActivitySourceType get sourceType => ActivitySourceType.mock;

  @override
  Future<bool> requestPermissions() async => true;

  @override
  Future<List<ActivityRecord>> fetchActivities(DateTime from, DateTime to) async {
    final now = DateTime.now();
    return [
      ActivityRecord(
        id: 'ar-001',
        userId: 'u-demo',
        campaignId: 'c-001',
        source: sourceType,
        activityType: ActivityType.stepsDaily,
        startedAt: DateTime(now.year, now.month, now.day),
        endedAt: now,
        steps: 7842,
        distanceKm: 5.6,
        durationSec: 4200,
        rawSourceId: 'mock-steps-${now.day}',
        status: ActivityStatus.accepted,
        impactPoints: impactPointsFor(ActivityType.stepsDaily, km: 5.6),
      ),
      ActivityRecord(
        id: 'ar-002',
        userId: 'u-demo',
        campaignId: 'c-001',
        source: sourceType,
        activityType: ActivityType.outdoorRun,
        startedAt: now.subtract(const Duration(days: 1, hours: 2)),
        endedAt: now.subtract(const Duration(days: 1)),
        distanceKm: 4.2,
        durationSec: 1800,
        rawSourceId: 'mock-run-${now.day - 1}',
        status: ActivityStatus.accepted,
        impactPoints: impactPointsFor(ActivityType.outdoorRun, km: 4.2),
      ),
    ];
  }
}
