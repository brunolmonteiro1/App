import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app/router.dart';
import 'app/theme.dart';
import 'data/app_state.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final state = await AppState.load();
  runApp(NortonApp(state: state));
}

class NortonApp extends StatelessWidget {
  const NortonApp({super.key, required this.state});

  final AppState state;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: state,
      child: MaterialApp.router(
        title: 'Norton Impact',
        debugShowCheckedModeBanner: false,
        theme: nortonTheme(Brightness.light),
        darkTheme: nortonTheme(Brightness.dark),
        // Quem já concluiu o onboarding cai direto na Home.
        routerConfig: buildRouter(
            initialLocation: state.onboarded ? '/home' : '/onboarding'),
      ),
    );
  }
}
