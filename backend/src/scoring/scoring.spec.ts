import { scorePrediction } from './scoring';

describe('scorePrediction', () => {
  const finishedMatch = {
    homeScore: 1,
    awayScore: 2,
    topScorerName: 'Mohamed Salah',
    topScorerGoals: 2,
  };

  it('awards 3 points for exact score', () => {
    const result = scorePrediction(
      {
        predictedHomeScore: 1,
        predictedAwayScore: 2,
        predictedTopScorer: null,
      },
      finishedMatch,
    );

    expect(result.exactScorePoints).toBe(3);
    expect(result.outcomePoints).toBe(0);
    expect(result.total).toBe(3);
  });

  it('awards 1 point for correct outcome only', () => {
    const result = scorePrediction(
      {
        predictedHomeScore: 0,
        predictedAwayScore: 3,
        predictedTopScorer: null,
      },
      finishedMatch,
    );

    expect(result.exactScorePoints).toBe(0);
    expect(result.outcomePoints).toBe(1);
    expect(result.total).toBe(1);
  });

  it('awards 10 points plus goal bonus for correct top scorer', () => {
    const result = scorePrediction(
      {
        predictedHomeScore: 0,
        predictedAwayScore: 0,
        predictedTopScorer: 'mohamed salah',
      },
      finishedMatch,
    );

    expect(result.topScorerPoints).toBe(10);
    expect(result.goalBonusPoints).toBe(2);
    expect(result.total).toBe(12);
  });

  it('combines exact score and top scorer points', () => {
    const result = scorePrediction(
      {
        predictedHomeScore: 1,
        predictedAwayScore: 2,
        predictedTopScorer: 'Mohamed Salah',
      },
      finishedMatch,
    );

    expect(result.exactScorePoints).toBe(3);
    expect(result.topScorerPoints).toBe(10);
    expect(result.goalBonusPoints).toBe(2);
    expect(result.total).toBe(15);
  });
});
