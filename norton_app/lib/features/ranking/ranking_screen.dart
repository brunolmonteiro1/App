import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/app_state.dart';
import '../../data/mock_data.dart';
import '../../data/models.dart';

class RankingScreen extends StatelessWidget {
  const RankingScreen({super.key});

  /// Insere o usuário (pontos REAIS dos treinos) entre os concorrentes de
  /// exemplo e reordena — o ranking muda conforme você treina.
  List<LeaderboardEntry> _boardWithUser(AppState app) {
    final others = leagueLeaderboard.where((e) => !e.isMe);
    final all = [
      ...others,
      LeaderboardEntry(
          rank: 0,
          name: app.userName,
          points: app.totalPoints,
          isMe: true,
          team: 'Você'),
    ]..sort((a, b) => b.points.compareTo(a.points));
    return [
      for (var i = 0; i < all.length; i++)
        LeaderboardEntry(
            rank: i + 1,
            name: all[i].name,
            points: all[i].points,
            isMe: all[i].isMe,
            team: all[i].team),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final app = context.watch<AppState>();
    final board = _boardWithUser(app);
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
            app.leagueCode == null
                ? _JoinLeague(
                    onJoin: (code) => context.read<AppState>().joinLeague(code))
                : _leagueBoard(context, scheme, app, board),
            _board(scheme, board),
          ],
        ),
      ),
    );
  }

  Widget _leagueBoard(BuildContext context, ColorScheme scheme, AppState app,
      List<LeaderboardEntry> board) {
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
                child: Text('Liga · código ${app.leagueCode}',
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: scheme.onPrimaryContainer)),
              ),
              TextButton(
                onPressed: () => context.read<AppState>().leaveLeague(),
                child: const Text('Sair'),
              ),
            ],
          ),
        ),
        Expanded(child: _board(scheme, board)),
      ],
    );
  }

  Widget _board(ColorScheme scheme, List<LeaderboardEntry> entries) {
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
                    child:
                        Text('${e.rank}', style: const TextStyle(fontSize: 13))),
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
