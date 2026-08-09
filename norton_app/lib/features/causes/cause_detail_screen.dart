import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/app_state.dart';
import '../../data/mock_data.dart';

class CauseDetailScreen extends StatelessWidget {
  const CauseDetailScreen({super.key, required this.causeId});

  final String causeId;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final c = causes.firstWhere((c) => c.id == causeId,
        orElse: () => causes.first);
    return Scaffold(
      appBar: AppBar(title: Text(c.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(child: Text(c.emoji, style: const TextStyle(fontSize: 72))),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _Fact(label: 'ONG', value: c.ngo),
                      _Fact(label: 'Patrocinador', value: c.sponsor),
                    ],
                  ),
                  const Divider(height: 32),
                  Text(c.description,
                      style: TextStyle(
                          height: 1.5, color: scheme.onSurfaceVariant)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Progresso coletivo',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 14),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child:
                        LinearProgressIndicator(value: c.progress, minHeight: 12),
                  ),
                  const SizedBox(height: 12),
                  // Marcos de liberação da verba fechada (25/50/100%)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      for (final (pct, share) in [
                        (0.25, 0.25),
                        (0.50, 0.50),
                        (1.00, 1.00)
                      ])
                        _Milestone(
                          label: '${(pct * 100).toInt()}%',
                          amount: c.budgetBrl * share,
                          reached: c.progress >= pct,
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: scheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Text('💰', style: TextStyle(fontSize: 24)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'R\$ ${c.unlockedBrl.toStringAsFixed(0)} de '
                            'R\$ ${c.budgetBrl.toStringAsFixed(0)} já '
                            'destravados pelo esforço coletivo',
                            style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: scheme.onPrimaryContainer),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Builder(builder: (context) {
            final app = context.watch<AppState>();
            final isActive = app.activeCauseId == c.id;
            return FilledButton.icon(
              onPressed: isActive
                  ? null
                  : () {
                      context.read<AppState>().setActiveCause(c.id);
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: Text(
                              '${c.name} agora é a sua causa ativa! Seus treinos contam para ela.')));
                    },
              icon: Icon(isActive ? Icons.check : Icons.favorite),
              label: Text(
                  isActive ? 'Esta é a sua causa ativa' : 'Participar desta causa'),
            );
          }),
        ],
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.1,
                color: scheme.onSurfaceVariant)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _Milestone extends StatelessWidget {
  const _Milestone(
      {required this.label, required this.amount, required this.reached});

  final String label;
  final double amount;
  final bool reached;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        Icon(reached ? Icons.check_circle : Icons.radio_button_unchecked,
            color: reached ? scheme.primary : scheme.outlineVariant, size: 20),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
        Text('R\$ ${amount.toStringAsFixed(0)}',
            style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
      ],
    );
  }
}
