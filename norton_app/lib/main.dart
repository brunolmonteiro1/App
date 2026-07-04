import 'package:flutter/material.dart';

import 'app/router.dart';
import 'app/theme.dart';

void main() => runApp(const NortonApp());

class NortonApp extends StatelessWidget {
  const NortonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Norton Impact',
      debugShowCheckedModeBanner: false,
      theme: nortonTheme(Brightness.light),
      darkTheme: nortonTheme(Brightness.dark),
      routerConfig: router,
    );
  }
}
