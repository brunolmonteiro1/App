import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../data/activity_source.dart';
import '../../data/mock_data.dart';
import '../../data/models.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ActivitySource _source = MockActivitySource();
  List<ActivityRecord> _today = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final now = DateTime.now();
    final records = await _source.fetchActivities(
        DateTime(now.year, now.month, now.day), now);
    if (mounted) setState(() => _today = records);
  }

  int get _steps => _today.fold(0, (sum, r) => sum + r.steps);
  double get _km =>
      _today.fold(0.0, (sum, r) => sum + r.distanceKm);
  double get _points =>
      _today.fold(0.0, (sum, r) => sum + r.impactPoints);

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final cause = causes.first;
    return Scaffold(
      appBar: AppBar(
        title: Text('Olá, ${demoUser.name} 👋'),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Progresso do dia
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('HOJE',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.2,
                            color: scheme.primary)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _Metric(value: '$_steps', label: 'passos'),
                        _Metric(value: _km.toStringAsFixed(1), label: 'km'),
                        _Metric(
                            value: _points.toStringAsFixed(1),
                            label: 'pontos',
                            highlight: true),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Streak
            Card(
              color: scheme.primaryContainer,
              child: ListTile(
                leading: const Text('🔥', style: TextStyle(fontSize: 32)),
                title: Text('${demoUser.streakDays} dias de ofensiva',
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                subtitle: const Text('Mova-se hoje para manter a sequência!'),
              ),
            ),
            const SizedBox(height: 12),
            // Causa ativa
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
                                Text('CAUSA ATIVA',
                                    style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 1.2,
                                        color: scheme.onSurfaceVariant)),
                                Text(cause.name,
                                    style: const TextStyle(
                                        fontSize: 16, fontWeight: FontWeight.w700)),
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

  void _showWorkoutSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final (icon, label) in [
              (Icons.directions_walk, 'Caminhada (indoor)'),
              (Icons.directions_run, 'Corrida / caminhada ao ar livre'),
              (Icons.directions_bike, 'Ciclismo'),
            ])
              ListTile(
                leading: Icon(icon),
                title: Text(label),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text(
                          'Protótipo: o treino com GPS entra na Fase 1a (ver roadmap).')));
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
