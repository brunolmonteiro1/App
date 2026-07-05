/// Fonte real de atividade via Health Connect (Android) / HealthKit (iOS),
/// usando o pacote `health`. Implementa a mesma interface `ActivitySource`
/// do mock — as telas não mudam.
library;

import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:health/health.dart';

import 'activity_source.dart';
import 'models.dart';

/// Situação do Health Connect no aparelho, para a tela de diagnóstico.
enum HealthAvailability {
  /// Pronto para uso.
  available,

  /// Aparelho suporta, mas o app Health Connect precisa ser instalado/atualizado.
  needsInstall,

  /// Aparelho não suporta (Android < 8) ou plataforma sem suporte.
  unsupported,
}

class HealthConnectActivitySource implements ActivitySource {
  HealthConnectActivitySource() {
    _health.configure();
  }

  final Health _health = Health();

  static const _types = [
    HealthDataType.STEPS,
    HealthDataType.DISTANCE_DELTA,
    HealthDataType.WORKOUT,
  ];

  @override
  ActivitySourceType get sourceType => ActivitySourceType.healthConnect;

  Future<HealthAvailability> availability() async {
    if (kIsWeb) return HealthAvailability.unsupported;
    if (Platform.isIOS) return HealthAvailability.available; // HealthKit nativo
    if (!Platform.isAndroid) return HealthAvailability.unsupported;
    final status = await _health.getHealthConnectSdkStatus();
    return switch (status) {
      HealthConnectSdkStatus.sdkAvailable => HealthAvailability.available,
      HealthConnectSdkStatus.sdkUnavailableProviderUpdateRequired =>
        HealthAvailability.needsInstall,
      _ => HealthAvailability.needsInstall,
    };
  }

  /// Abre a Play Store na página do Health Connect.
  Future<void> installHealthConnect() => _health.installHealthConnect();

  Future<bool> hasPermissions() async {
    final granted = await _health.hasPermissions(_types);
    return granted ?? false;
  }

  @override
  Future<bool> requestPermissions() async {
    return _health.requestAuthorization(_types);
  }

  @override
  Future<List<ActivityRecord>> fetchActivities(
      DateTime from, DateTime to) async {
    final records = <ActivityRecord>[];
    final day = '${from.year}-${from.month}-${from.day}';

    // Passos agregados do período (o próprio HC deduplica múltiplas fontes).
    final steps = await _health.getTotalStepsInInterval(from, to);

    // Distância percorrida no período.
    double distanceMeters = 0;
    final distancePoints = await _health.getHealthDataFromTypes(
      types: [HealthDataType.DISTANCE_DELTA],
      startTime: from,
      endTime: to,
    );
    for (final p in _health.removeDuplicates(distancePoints)) {
      final v = p.value;
      if (v is NumericHealthValue) {
        distanceMeters += v.numericValue.toDouble();
      }
    }

    if ((steps ?? 0) > 0 || distanceMeters > 0) {
      final km = distanceMeters / 1000.0;
      records.add(ActivityRecord(
        id: 'hc-daily-$day',
        userId: 'u-local',
        source: sourceType,
        activityType: ActivityType.stepsDaily,
        startedAt: from,
        endedAt: to,
        steps: steps ?? 0,
        distanceKm: km,
        durationSec: to.difference(from).inSeconds,
        rawSourceId: 'hc-daily-$day',
        status: ActivityStatus.accepted,
        impactPoints: impactPointsFor(ActivityType.stepsDaily, km: km),
      ));
    }

    // Treinos registrados (corrida, caminhada, bike...).
    final workouts = await _health.getHealthDataFromTypes(
      types: [HealthDataType.WORKOUT],
      startTime: from,
      endTime: to,
    );
    for (final w in _health.removeDuplicates(workouts)) {
      final v = w.value;
      if (v is! WorkoutHealthValue) continue;
      final km = (v.totalDistance ?? 0) / 1000.0;
      final type = _mapWorkoutType(v.workoutActivityType);
      records.add(ActivityRecord(
        id: 'hc-workout-${w.uuid}',
        userId: 'u-local',
        source: sourceType,
        activityType: type,
        startedAt: w.dateFrom,
        endedAt: w.dateTo,
        distanceKm: km,
        durationSec: w.dateTo.difference(w.dateFrom).inSeconds,
        rawSourceId: w.uuid,
        status: ActivityStatus.accepted,
        impactPoints: impactPointsFor(type, km: km),
      ));
    }

    return records;
  }

  ActivityType _mapWorkoutType(HealthWorkoutActivityType t) {
    switch (t) {
      case HealthWorkoutActivityType.RUNNING:
      case HealthWorkoutActivityType.RUNNING_TREADMILL:
        return ActivityType.outdoorRun;
      case HealthWorkoutActivityType.BIKING:
        return ActivityType.cycling;
      case HealthWorkoutActivityType.WALKING:
        return ActivityType.outdoorWalk;
      default:
        return ActivityType.outdoorWalk;
    }
  }
}
