import 'package:go_router/go_router.dart';

import '../features/causes/cause_detail_screen.dart';
import '../features/causes/causes_screen.dart';
import '../features/challenges/challenges_screen.dart';
import '../features/health/health_status_screen.dart';
import '../features/home/home_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/ranking/ranking_screen.dart';
import '../features/workout/workout_screen.dart';
import '../shell.dart';

GoRouter buildRouter({required String initialLocation}) => GoRouter(
      initialLocation: initialLocation,
      routes: [
        GoRoute(
          path: '/onboarding',
          builder: (context, state) => const OnboardingScreen(),
        ),
        GoRoute(
          path: '/health',
          builder: (context, state) => const HealthStatusScreen(),
        ),
        GoRoute(
          path: '/workout/:type',
          builder: (context, state) =>
              WorkoutScreen(typeName: state.pathParameters['type']!),
        ),
        StatefulShellRoute.indexedStack(
          builder: (context, state, shell) => AppShell(shell: shell),
          branches: [
            StatefulShellBranch(routes: [
              GoRoute(
                  path: '/home', builder: (context, state) => const HomeScreen()),
            ]),
            StatefulShellBranch(routes: [
              GoRoute(
                path: '/causes',
                builder: (context, state) => const CausesScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    builder: (context, state) =>
                        CauseDetailScreen(causeId: state.pathParameters['id']!),
                  ),
                ],
              ),
            ]),
            StatefulShellBranch(routes: [
              GoRoute(
                path: '/challenges',
                builder: (context, state) => const ChallengesScreen(),
              ),
            ]),
            StatefulShellBranch(routes: [
              GoRoute(
                path: '/ranking',
                builder: (context, state) => const RankingScreen(),
              ),
            ]),
            StatefulShellBranch(routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ]),
          ],
        ),
      ],
    );
