import 'package:flutter_test/flutter_test.dart';
import 'package:norton_app/data/models.dart';

void main() {
  group('Conversão em Pontos de Impacto', () {
    test('caminhada e corrida valem 1 ponto por km', () {
      expect(impactPointsFor(ActivityType.outdoorWalk, km: 5), 5.0);
      expect(impactPointsFor(ActivityType.outdoorRun, km: 10), 10.0);
      expect(impactPointsFor(ActivityType.stepsDaily, km: 3.5), 3.5);
    });

    test('ciclismo vale 0,25 ponto por km (equaliza volume de bike)', () {
      expect(impactPointsFor(ActivityType.cycling, km: 40), 10.0);
    });
  });

  group('Marcos de liberação da verba fechada', () {
    Cause causeAt(double points) => Cause(
          id: 'c',
          name: 'c',
          ngo: 'n',
          sponsor: 's',
          description: '',
          goalPoints: 1000,
          currentPoints: points,
          budgetBrl: 10000,
          emoji: '⭐',
        );

    test('abaixo de 25% nada é destravado', () {
      expect(causeAt(240).unlockedBrl, 0);
    });
    test('25% da meta destrava 25% da verba', () {
      expect(causeAt(250).unlockedBrl, 2500);
    });
    test('50% da meta destrava 50% da verba', () {
      expect(causeAt(600).unlockedBrl, 5000);
    });
    test('meta completa destrava 100% da verba', () {
      expect(causeAt(1000).unlockedBrl, 10000);
    });
  });
}
