import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../data/mock_data.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: scheme.primaryContainer,
                  child: Text(demoUser.name[0],
                      style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w800,
                          color: scheme.onPrimaryContainer)),
                ),
                const SizedBox(height: 12),
                Text(demoUser.name,
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _Stat(value: demoUser.totalPoints.toStringAsFixed(0), label: 'pontos'),
                  _Stat(value: '${demoUser.totalKm.toStringAsFixed(0)} km', label: 'validados'),
                  _Stat(value: '${demoUser.streakDays} 🔥', label: 'streak'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Conquistas',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final b in demoUser.badges)
                Chip(avatar: const Text('🏅'), label: Text(b)),
            ],
          ),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                _SettingsTile(
                    icon: Icons.favorite_outline,
                    title: 'Permissões de saúde',
                    subtitle: 'Health Connect · diagnóstico e conexão',
                    onTap: () => context.push('/health')),
                _SettingsTile(
                    icon: Icons.notifications_outlined,
                    title: 'Notificações',
                    subtitle: 'Lembrete diário ativo'),
                _SettingsTile(
                    icon: Icons.shield_outlined,
                    title: 'Privacidade e dados (LGPD)',
                    subtitle: 'Consentimentos, exportação e exclusão de conta'),
                _SettingsTile(
                    icon: Icons.help_outline,
                    title: 'Ajuda / FAQ',
                    subtitle: 'Tracking, ligas, pontos e capping'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text('Norton Impact · protótipo Fase 0',
                style:
                    TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        Text(value,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
        Text(label,
            style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile(
      {required this.icon,
      required this.title,
      required this.subtitle,
      this.onTap});

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap ?? () {},
    );
  }
}
