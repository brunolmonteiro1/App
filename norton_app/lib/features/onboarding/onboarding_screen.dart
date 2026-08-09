import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../data/app_state.dart';

class _Slide {
  const _Slide(this.emoji, this.title, this.body);
  final String emoji;
  final String title;
  final String body;
}

const _slides = [
  _Slide('👟', 'Cada passo conta',
      'Seu movimento diário — caminhada, corrida ou bike — vira Pontos de Impacto automaticamente.'),
  _Slide('🤝', 'Seja um agente de mudança',
      'O esforço coletivo destrava doações reais de empresas patrocinadoras para ONGs verificadas.'),
  _Slide('🎁', 'Ganhe vantagens',
      'Streaks, badges e pontos destravam cupons e benefícios de marcas parceiras. Fazer o bem traz retorno.'),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _next() {
    if (_page < _slides.length - 1) {
      _controller.nextPage(
          duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
    } else {
      _showConsentSheet();
    }
  }

  /// Consentimento LGPD de dados de saúde: no produto real, este é o ponto em
  /// que o app pede as permissões do Health Connect/HealthKit.
  void _showConsentSheet() {
    final scheme = Theme.of(context).colorScheme;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Permissão de dados de atividade',
                style: Theme.of(sheetContext).textTheme.titleLarge),
            const SizedBox(height: 12),
            Text(
              'Para calcular seu progresso, ranking e impacto, o Norton lê '
              'passos, distância e treinos do seu aparelho (Health Connect no '
              'Android, Saúde no iPhone).\n\n'
              '• Usamos os dados somente para as campanhas que você participa.\n'
              '• Empresas veem apenas números agregados — nunca seus dados individuais.\n'
              '• Você pode revogar o acesso e excluir seus dados quando quiser.',
              style: TextStyle(color: scheme.onSurfaceVariant, height: 1.4),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {
                  Navigator.of(sheetContext).pop();
                  context.read<AppState>().completeOnboarding();
                  context.go('/home');
                },
                child: const Text('Autorizar e começar'),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () {
                  Navigator.of(sheetContext).pop();
                  context.read<AppState>().completeOnboarding();
                  context.go('/home');
                },
                child: const Text('Agora não (modo demonstração)'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: () {
                  context.read<AppState>().completeOnboarding();
                  context.go('/home');
                },
                child: const Text('Pular'),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _page = i),
                itemBuilder: (context, i) {
                  final s = _slides[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(s.emoji, style: const TextStyle(fontSize: 96)),
                        const SizedBox(height: 32),
                        Text(s.title,
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .headlineMedium
                                ?.copyWith(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 16),
                        Text(s.body,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                fontSize: 16,
                                height: 1.5,
                                color: scheme.onSurfaceVariant)),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _slides.length,
                (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: i == _page ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: i == _page ? scheme.primary : scheme.outlineVariant,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _next,
                  child: Text(_page < _slides.length - 1 ? 'Continuar' : 'Criar conta'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
