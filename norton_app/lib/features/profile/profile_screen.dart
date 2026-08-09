import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../data/app_state.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _editName(BuildContext context, AppState app) async {
    final controller = TextEditingController(text: app.userName);
    final name = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Seu nome'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Cancelar')),
          FilledButton(
              onPressed: () =>
                  Navigator.of(dialogContext).pop(controller.text),
              child: const Text('Salvar')),
        ],
      ),
    );
    if (name != null && context.mounted) {
      context.read<AppState>().setUserName(name);
    }
  }

  Future<void> _confirmReset(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Zerar meus dados?'),
        content: const Text(
            'Treinos, pontos, causa, liga e desafios serão apagados deste aparelho.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancelar')),
          FilledButton.tonal(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Zerar')),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      await context.read<AppState>().resetAll();
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final app = context.watch<AppState>();
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
                  child: Text(app.userName[0].toUpperCase(),
                      style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w800,
                          color: scheme.onPrimaryContainer)),
                ),
                const SizedBox(height: 12),
                InkWell(
                  onTap: () => _editName(context, app),
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(app.userName,
                            style: const TextStyle(
                                fontSize: 20, fontWeight: FontWeight.w700)),
                        const SizedBox(width: 6),
                        Icon(Icons.edit, size: 16, color: scheme.onSurfaceVariant),
                      ],
                    ),
                  ),
                ),
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
                  _Stat(
                      value: app.totalPoints.toStringAsFixed(1),
                      label: 'pontos'),
                  _Stat(
                      value: '${app.totalKm.toStringAsFixed(1)} km',
                      label: 'validados'),
                  _Stat(value: '${app.streakDays} 🔥', label: 'streak'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Conquistas',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (app.badges.isEmpty)
            Text('Grave o seu primeiro treino para desbloquear conquistas.',
                style: TextStyle(color: scheme.onSurfaceVariant))
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final b in app.badges)
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
                    subtitle: 'Chega na Fase 1a (push/FCM)'),
                _SettingsTile(
                    icon: Icons.shield_outlined,
                    title: 'Privacidade e dados (LGPD)',
                    subtitle: 'Zerar dados deste aparelho',
                    onTap: () => _confirmReset(context)),
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
                style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
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
