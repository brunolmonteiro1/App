import 'package:flutter/material.dart';

import '../../data/mock_data.dart';

class RankingScreen extends StatefulWidget {
  const RankingScreen({super.key});

  @override
  State<RankingScreen> createState() => _RankingScreenState();
}

class _RankingScreenState extends State<RankingScreen> {
  String? _leagueCode = demoUser.leagueCode;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Ranking'),
          bottom: const TabBar(tabs: [
            Tab(text: 'Liga corporativa'),
            Tab(text: 'Desafio geral'),
          ]),
        ),
        body: TabBarView(
          children: [
            _leagueCode == null ? _JoinLeague(onJoin: _join) : _leagueBoard(scheme),
            _board(scheme, leagueLeaderboard),
          ],
        ),
      ),
    );
  }

  void _join(String code) => setState(() => _leagueCode = code.toUpperCase());

  Widget _leagueBoard(ColorScheme scheme) {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: scheme.primaryContainer,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Text('🏢', style: TextStyle(fontSize: 24)),
              const SizedBox(width: 12),
              Expanded(
                child: Text('Liga ACME S.A. · código $_leagueCode',
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: scheme.onPrimaryContainer)),
              ),
            ],
          ),
        ),
        Expanded(child: _board(scheme, leagueLeaderboard)),
      ],
    );
  }

  Widget _board(ColorScheme scheme, List entries) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: entries.length,
      separatorBuilder: (context, i) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        final e = entries[i];
        final medal = switch (e.rank) {
          1 => '🥇',
          2 => '🥈',
          3 => '🥉',
          _ => null,
        };
        return Card(
          color: e.isMe ? scheme.primaryContainer : null,
          child: ListTile(
            leading: medal != null
                ? Text(medal, style: const TextStyle(fontSize: 26))
                : CircleAvatar(
                    radius: 16,
                    child: Text('${e.rank}',
                        style: const TextStyle(fontSize: 13))),
            title: Text(e.isMe ? '${e.name} (você)' : e.name,
                style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: e.team != null ? Text(e.team!) : null,
            trailing: Text('${e.points.toStringAsFixed(1)} pts',
                style: TextStyle(
                    fontWeight: FontWeight.w700, color: scheme.primary)),
          ),
        );
      },
    );
  }
}

class _JoinLeague extends StatefulWidget {
  const _JoinLeague({required this.onJoin});

  final ValueChanged<String> onJoin;

  @override
  State<_JoinLeague> createState() => _JoinLeagueState();
}

class _JoinLeagueState extends State<_JoinLeague> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('🔑', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          const Text('Entre na liga da sua empresa',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
            'Digite o código fornecido pelo RH para competir com seus colegas '
            'em campanhas exclusivas.',
            textAlign: TextAlign.center,
            style: TextStyle(color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _controller,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              labelText: 'Código da liga',
              hintText: 'ex.: ACME2026',
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () {
                if (_controller.text.trim().isNotEmpty) {
                  widget.onJoin(_controller.text.trim());
                }
              },
              child: const Text('Entrar na liga'),
            ),
          ),
        ],
      ),
    );
  }
}
