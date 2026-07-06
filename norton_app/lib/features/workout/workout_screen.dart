import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../data/app_state.dart';
import '../../data/models.dart';
import '../../data/pedometer_source.dart';

/// Sessão de treino real: cronômetro + passos do sensor do aparelho.
///
/// Ao finalizar, gera um [WorkoutSession] com pontos calculados pela regra
/// de conversão do blueprint e persiste no [AppState] — Home, Ranking e
/// Perfil refletem na hora. Distância estimada por passos (0,75 m/passo)
/// para caminhada/corrida; para bike, por tempo (15 km/h) — estimativas de
/// protótipo, substituídas por GPS na Fase 1b.
class WorkoutScreen extends StatefulWidget {
  const WorkoutScreen({super.key, required this.typeName});

  final String typeName;

  @override
  State<WorkoutScreen> createState() => _WorkoutScreenState();
}

class _WorkoutScreenState extends State<WorkoutScreen> {
  final _pedometer = PedometerSource();
  Timer? _timer;
  int _seconds = 0;
  bool _running = false;
  bool _sensorOk = false;
  String? _sensorMsg;

  ActivityType get _type => ActivityType.values.firstWhere(
        (t) => t.name == widget.typeName,
        orElse: () => ActivityType.outdoorWalk,
      );

  String get _title => switch (_type) {
        ActivityType.indoorWalk => 'Caminhada (indoor)',
        ActivityType.outdoorWalk => 'Caminhada',
        ActivityType.outdoorRun => 'Corrida',
        ActivityType.cycling => 'Ciclismo',
        ActivityType.stepsDaily => 'Atividade',
      };

  double get _distanceKm => _type == ActivityType.cycling
      ? _seconds / 3600.0 * 15.0
      : _pedometer.sessionSteps * 0.00075;

  double get _points => impactPointsFor(_type, km: _distanceKm);

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    final granted = await _pedometer.requestPermission();
    if (granted) {
      await _pedometer.start(
        () => setState(() => _sensorOk = true),
        onError: (m) => setState(() => _sensorMsg = m),
      );
    } else {
      _sensorMsg = 'Sem permissão de atividade física — contando só o tempo.';
    }
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_running && mounted) setState(() => _seconds++);
    });
    setState(() => _running = true);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pedometer.dispose();
    super.dispose();
  }

  void _finish() {
    final session = WorkoutSession(
      type: _type,
      startedAt: DateTime.now().subtract(Duration(seconds: _seconds)),
      durationSec: _seconds,
      steps: _pedometer.sessionSteps,
      distanceKm: _distanceKm,
      points: _points,
    );
    context.read<AppState>().addSession(session);
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Treino concluído! 🎉'),
        content: Text(
          '${_fmt(_seconds)} de $_title\n'
          '${session.steps} passos · ${session.distanceKm.toStringAsFixed(2)} km\n\n'
          '+${session.points.toStringAsFixed(2)} Pontos de Impacto para a sua causa!',
        ),
        actions: [
          FilledButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              context.pop();
            },
            child: const Text('Ver na Home'),
          ),
        ],
      ),
    );
  }

  String _fmt(int s) =>
      '${(s ~/ 60).toString().padLeft(2, '0')}:${(s % 60).toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(_title)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Spacer(),
            Text(_fmt(_seconds),
                style: TextStyle(
                    fontSize: 72,
                    fontWeight: FontWeight.w800,
                    fontFeatures: const [FontFeature.tabularFigures()],
                    color: scheme.primary)),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _Metric('${_pedometer.sessionSteps}', 'passos'),
                _Metric(_distanceKm.toStringAsFixed(2), 'km (est.)'),
                _Metric(_points.toStringAsFixed(2), 'pontos'),
              ],
            ),
            const SizedBox(height: 16),
            if (_sensorMsg != null)
              Text(_sensorMsg!,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: scheme.error))
            else if (_sensorOk)
              Text('Sensor de passos ativo — ande com o celular.',
                  style:
                      TextStyle(fontSize: 13, color: scheme.onSurfaceVariant)),
            const Spacer(),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () =>
                        setState(() => _running = !_running),
                    icon: Icon(_running ? Icons.pause : Icons.play_arrow),
                    label: Text(_running ? 'Pausar' : 'Retomar'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _seconds > 0 ? _finish : null,
                    icon: const Icon(Icons.flag),
                    label: const Text('Finalizar'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric(this.value, this.label);

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(children: [
      Text(value,
          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
      Text(label, style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
    ]);
  }
}
