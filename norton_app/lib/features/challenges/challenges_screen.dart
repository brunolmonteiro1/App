import 'package:flutter/material.dart';

import '../../data/mock_data.dart';

class ChallengesScreen extends StatefulWidget {
  const ChallengesScreen({super.key});

  @override
  State<ChallengesScreen> createState() => _ChallengesScreenState();
}

class _ChallengesScreenState extends State<ChallengesScreen> {
  final Set<String> _joined = {
    for (final c in challenges)
      if (c.joined) c.id
  };

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Desafios')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: challenges.length,
        separatorBuilder: (context, i) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          final ch = challenges[i];
          final joined = _joined.contains(ch.id);
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(ch.title,
                            style: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w700)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: scheme.secondaryContainer,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('${ch.durationDays} dias',
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: scheme.onSecondaryContainer)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${ch.metric} · ${ch.participants} participantes · '
                    'termina em ${ch.endsIn.inDays} dias',
                    style:
                        TextStyle(fontSize: 13, color: scheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 4),
                  Text('🏆 ${ch.reward}',
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: joined
                        ? OutlinedButton.icon(
                            onPressed: null,
                            icon: const Icon(Icons.check),
                            label: const Text('Inscrito'),
                          )
                        : FilledButton.tonal(
                            onPressed: () =>
                                setState(() => _joined.add(ch.id)),
                            child: const Text('Participar'),
                          ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
