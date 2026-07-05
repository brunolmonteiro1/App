import 'package:flutter/material.dart';

import '../../data/health_activity_source.dart';
import '../../data/models.dart';
import '../../data/pedometer_source.dart';

/// Tela de diagnóstico da integração de saúde.
///
/// Mostra, sem esconder nada: disponibilidade do Health Connect, estado das
/// permissões, leituras cruas e o sensor de passos ao vivo. É a tela que o
/// usuário fotografa para reportar qualquer problema em uma única ida e volta.
class HealthStatusScreen extends StatefulWidget {
  const HealthStatusScreen({super.key});

  @override
  State<HealthStatusScreen> createState() => _HealthStatusScreenState();
}

class _HealthStatusScreenState extends State<HealthStatusScreen> {
  final _hc = HealthConnectActivitySource();
  final _pedometer = PedometerSource();

  HealthAvailability? _availability;
  bool? _permissions;
  bool _pedometerOn = false;
  String? _pedometerError;
  List<ActivityRecord>? _lastRead;
  String? _readError;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _refreshStatus();
  }

  @override
  void dispose() {
    _pedometer.dispose();
    super.dispose();
  }

  Future<void> _refreshStatus() async {
    setState(() => _busy = true);
    try {
      final av = await _hc.availability();
      bool? perms;
      if (av == HealthAvailability.available) {
        perms = await _hc.hasPermissions();
      }
      setState(() {
        _availability = av;
        _permissions = perms;
      });
    } catch (e) {
      setState(() => _readError = 'Erro ao checar status: $e');
    } finally {
      setState(() => _busy = false);
    }
  }

  Future<void> _requestPermissions() async {
    setState(() => _busy = true);
    try {
      final ok = await _hc.requestPermissions();
      setState(() => _permissions = ok);
      if (ok) await _readNow();
    } catch (e) {
      setState(() => _readError = 'Erro ao pedir permissões: $e');
    } finally {
      setState(() => _busy = false);
    }
  }

  Future<void> _readNow() async {
    setState(() {
      _busy = true;
      _readError = null;
    });
    try {
      final now = DateTime.now();
      final start = DateTime(now.year, now.month, now.day);
      final records = await _hc.fetchActivities(start, now);
      setState(() => _lastRead = records);
    } catch (e) {
      setState(() => _readError = 'Erro na leitura: $e');
    } finally {
      setState(() => _busy = false);
    }
  }

  Future<void> _togglePedometer() async {
    final granted = await _pedometer.requestPermission();
    if (!granted) {
      setState(() => _pedometerError = 'Permissão de atividade física negada.');
      return;
    }
    await _pedometer.start(
      () => setState(() {}),
      onError: (msg) => setState(() => _pedometerError = msg),
    );
    setState(() {
      _pedometerOn = true;
      _pedometerError = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Diagnóstico de saúde')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_busy) const LinearProgressIndicator(),
          const SizedBox(height: 8),
          _statusCard(scheme),
          const SizedBox(height: 12),
          _readCard(scheme),
          const SizedBox(height: 12),
          _pedometerCard(scheme),
          const SizedBox(height: 16),
          Text(
            'Dica: se os passos do Health Connect estiverem zerados, verifique '
            'se algum app (Google Fit, Samsung Health) está registrando passos '
            'nele em Ajustes > Health Connect > Apps.',
            style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }

  Widget _statusCard(ColorScheme scheme) {
    final av = _availability;
    final (icon, text, color) = switch (av) {
      null => (Icons.hourglass_empty, 'Verificando…', scheme.onSurfaceVariant),
      HealthAvailability.available => (
          Icons.check_circle,
          'Health Connect disponível',
          scheme.primary
        ),
      HealthAvailability.needsInstall => (
          Icons.download,
          'Health Connect precisa ser instalado/atualizado',
          scheme.error
        ),
      HealthAvailability.unsupported => (
          Icons.block,
          'Aparelho não suporta Health Connect',
          scheme.error
        ),
    };
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('1 · Health Connect',
                style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Row(children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Expanded(child: Text(text)),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              Icon(
                _permissions == true ? Icons.check_circle : Icons.cancel,
                color: _permissions == true ? scheme.primary : scheme.error,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(_permissions == true
                    ? 'Permissões concedidas'
                    : 'Permissões pendentes'),
              ),
            ]),
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: [
              if (av == HealthAvailability.needsInstall)
                FilledButton.icon(
                  onPressed: () => _hc.installHealthConnect(),
                  icon: const Icon(Icons.download),
                  label: const Text('Instalar Health Connect'),
                ),
              if (av == HealthAvailability.available && _permissions != true)
                FilledButton.icon(
                  onPressed: _busy ? null : _requestPermissions,
                  icon: const Icon(Icons.lock_open),
                  label: const Text('Conceder permissões'),
                ),
              OutlinedButton.icon(
                onPressed: _busy ? null : _refreshStatus,
                icon: const Icon(Icons.refresh),
                label: const Text('Atualizar status'),
              ),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _readCard(ColorScheme scheme) {
    final read = _lastRead;
    final steps = read?.fold<int>(0, (s, r) => s + r.steps) ?? 0;
    final km = read?.fold<double>(0, (s, r) => s + r.distanceKm) ?? 0;
    final workouts =
        read?.where((r) => r.activityType != ActivityType.stepsDaily).length ?? 0;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('2 · Leitura de hoje',
                style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            if (_readError != null)
              Text(_readError!, style: TextStyle(color: scheme.error))
            else if (read == null)
              const Text('Nenhuma leitura feita ainda.')
            else
              Text('Passos: $steps · Distância: ${km.toStringAsFixed(2)} km · '
                  'Treinos: $workouts · Registros: ${read.length}'),
            const SizedBox(height: 12),
            FilledButton.tonalIcon(
              onPressed: (_busy || _permissions != true) ? null : _readNow,
              icon: const Icon(Icons.play_arrow),
              label: const Text('Ler agora'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _pedometerCard(ColorScheme scheme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('3 · Sensor do aparelho (reserva)',
                style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            if (_pedometerError != null)
              Text(_pedometerError!, style: TextStyle(color: scheme.error))
            else if (_pedometerOn)
              Text(
                '${_pedometer.sessionSteps} passos desde que você ligou o sensor '
                '— ande com o celular na mão para ver subir.',
              )
            else
              const Text('Sensor desligado.'),
            const SizedBox(height: 12),
            FilledButton.tonalIcon(
              onPressed: _pedometerOn ? null : _togglePedometer,
              icon: const Icon(Icons.sensors),
              label: Text(_pedometerOn ? 'Sensor ativo' : 'Ligar sensor'),
            ),
          ],
        ),
      ),
    );
  }
}
