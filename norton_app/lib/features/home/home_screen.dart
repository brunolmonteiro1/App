import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../data/app_state.dart';
import '../../data/health_activity_source.dart';
import '../../data/mock_data.dart';
import '../../data/models.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _healthSource = HealthConnectActivitySource();
  List<ActivityRecord> _healthToday = const [];
  bool _healthActive = false;

  @override
  void initState() {
    super.initState();
    _loadHealth();
  }

  /// Lê o Health Connect quando disponível; treinos in-app vêm do AppState.
  Future<void> _loadHealth() async {
    try {
      final now = DateTime.now();
      final start = DateTime(now.year, now.month, now.day);
      final available =
          await _healthSource.availability() == HealthAvailability.available;
      if (available && await _healthSource.hasPermissions()) {
        final records = await _healthSource.fetchActivities(start, now);
        if (mounted) {
          setState(() {
            _healthToday = records;
            _healthActive = true;
          });
        }
      }
    } catch (_) {
      // Sem Health Connect: os totais usam apenas treinos in-app.
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final app = context.watch<AppState>();

    final steps =
        app.todaySteps + _healthToday.fold<int>(0, (t, r) => t + r.steps);
    final km =
        app.todayKm + _healthToday.fold<double>(0, (t, r) => t + r.distanceKm);
    final points = app.todayPoints +
        _healthToday.fold<double>(0, (t, r) => t + r.impactPoints);

    final cause = causes.firstWhere((c) => c.id == app.activeCauseId,
        orElse: () => causes.first);
    final hasActiveCause = app.activeCauseId != null;
    final sourceLabel = _healthActive
        ? 'Health Connect + treinos'
        : (app.sessions.isEmpty ? 'sem dados ainda' : 'treinos no app');

    return Scaffold(
      appBar: AppBar(
        title: Text('Olá, ${app.userName} 👋'),
        actions: [
          IconButton(
              icon: const Icon(Icons.monitor_heart_outlined),
              tooltip: 'Diagnóstico de saúde',
              onPressed: () => context.push('/health')),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadHealth,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('HOJE',
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.2,
                                color: scheme.primary)),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _healthActive
                                ? scheme.primaryContainer
                                : scheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(sourceLabel,
                              style: TextStyle(
                                  fontSize: 11,
                                  color: scheme.onSurfaceVariant)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _Metric(value: '$steps', label: 'passos'),
                        _Metric(value: km.toStringAsFixed(1), label: 'km'),
                        _Metric(
                            value: points.toStringAsFixed(1),
                            label: 'pontos',
                            highlight: true),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              color: app.streakDays > 0
                  ? scheme.primaryContainer
                  : scheme.surfaceContainerHigh,
              child: ListTile(
                leading: Text(app.streakDays > 0 ? '🔥' : '💤',
                    style: const TextStyle(fontSize: 32)),
                title: Text(
                    app.streakDays > 0
                        ? '${app.streakDays} ${app.streakDays == 1 ? "dia" : "dias"} de ofensiva'
                        : 'Nenhuma ofensiva ativa',
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text(app.streakDays > 0
                    ? 'Mova-se hoje para manter a sequência!'
                    : 'Grave um treino para começar a sua sequência.'),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => context.go('/causes/${cause.id}'),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(cause.emoji, style: const TextStyle(fontSize: 28)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                    hasActiveCause
                                        ? 'SUA CAUSA ATIVA'
                                        : 'CAUSA EM DESTAQUE',
                                    style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 1.2,
                                        color: scheme.onSurfaceVariant)),
                                Text(cause.name,
                                    style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                            value: cause.progress, minHeight: 10),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${(cause.progress * 100).toStringAsFixed(0)}% da meta '
                        'coletiva · R\$ ${cause.unlockedBrl.toStringAsFixed(0)} '
                        'já destravados para a ONG',
                        style: TextStyle(
                            fontSize: 13, color: scheme.onSurfaceVariant),
                      ),
                      if (!hasActiveCause) ...[
                        const SizedBox(height: 8),
                        Text('Toque para escolher a sua causa →',
                            style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: scheme.primary)),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () => _showWorkoutSheet(context),
              icon: const Icon(Icons.play_arrow),
              label: const Text('Iniciar treino'),
            ),
          ],
        ),
      ),
    );
  }

  /// Abre a escolha de modalidade e navega para a sessão de treino REAL.
  void _showWorkoutSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final (icon, label, type) in [
              (Icons.directions_walk, 'Caminhada (indoor)',
                  ActivityType.indoorWalk),
              (Icons.directions_run, 'Corrida / caminhada ao ar livre',
                  ActivityType.outdoorRun),
              (Icons.directions_bike, 'Ciclismo', ActivityType.cycling),
            ])
              ListTile(
                leading: Icon(icon),
                title: Text(label),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  context.push('/workout/${type.name}');
                },
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.value, required this.label, this.highlight = false});

  final String value;
  final String label;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        Text(value,
            style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: highlight ? scheme.primary : scheme.onSurface)),
        Text(label, style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant)),
      ],
    );
  }
}
