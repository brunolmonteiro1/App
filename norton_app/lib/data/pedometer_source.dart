/// Fonte reserva: contador de passos direto do sensor do aparelho.
///
/// Útil quando o Health Connect está vazio (nenhum app alimentando-o) ou
/// indisponível. Conta passos desde o boot do aparelho; o app calcula o
/// delta a partir do primeiro valor observado na sessão.
library;

import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:pedometer/pedometer.dart';
import 'package:permission_handler/permission_handler.dart';

class PedometerSource {
  StreamSubscription<StepCount>? _sub;
  int? _baseline;
  int _current = 0;

  bool get supported => !kIsWeb && Platform.isAndroid;

  /// Passos contados desde que o stream começou nesta sessão.
  int get sessionSteps =>
      (_baseline == null) ? 0 : (_current - _baseline!).clamp(0, 1 << 31);

  Future<bool> requestPermission() async {
    if (!supported) return false;
    final status = await Permission.activityRecognition.request();
    return status.isGranted;
  }

  /// Começa a escutar o sensor. `onUpdate` é chamado a cada novo passo.
  Future<void> start(VoidCallback onUpdate, {ValueChanged<String>? onError}) async {
    if (!supported) {
      onError?.call('Sensor de passos disponível apenas no Android.');
      return;
    }
    await _sub?.cancel();
    _sub = Pedometer.stepCountStream.listen(
      (event) {
        _baseline ??= event.steps;
        _current = event.steps;
        onUpdate();
      },
      onError: (Object e) => onError?.call('Sensor indisponível: $e'),
      cancelOnError: false,
    );
  }

  Future<void> dispose() async {
    await _sub?.cancel();
    _sub = null;
  }
}
