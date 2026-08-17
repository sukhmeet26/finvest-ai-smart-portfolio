# FinVest AI: Smart Portfolio

Build a production-grade Agentic AI financial portfolio intelligence platform called “FinVest AI” using React + TypeScript frontend, Python + FastAPI backend, PostgreSQL, Redis, and LangGraph for multi-agent orchestration.

The user should enter total capital, desired allocation across Low/Moderate/High risk, investment horizon, liquidity needs, financial goal, and maximum acceptable drawdown.

Create a Portfolio Manager Agent that orchestrates specialized Risk Profiler, Market Research, Low-Risk, Moderate-Risk, High-Risk, Risk Analysis, and Portfolio Critic agents.

The system must research available financial instruments, evaluate historical performance, volatility, liquidity, diversification, valuation, and risk, then generate a portfolio that respects the user's exact allocation constraints.

Implement a deterministic Python Risk Engine for portfolio volatility, expected return, Sharpe ratio, Sortino ratio, maximum drawdown, VaR, beta, correlation, concentration, and stress testing; never let the LLM perform financial calculations.

Implement an agentic feedback loop where the Portfolio Critic Agent identifies concentration, excessive risk, poor diversification, or constraint violations and the Portfolio Manager Agent iteratively rebalances the portfolio until the constraints are satisfied.

Build a modern financial dashboard showing portfolio allocation, risk/return metrics, asset performance, diversification, drawdown, stress-test results, agent reasoning/status, and an AI-generated explanation of every allocation decision.

Add conversational functionality allowing users to ask questions such as “Why did you allocate ₹8 lakh to low risk?”, “What happens if the market falls 20%?”, and “Show me an alternative portfolio with lower volatility?” with answers grounded in retrieved financial data.

Add a Portfolio Monitoring Agent that detects portfolio drift, unusual volatility, market events, and risk-limit breaches and generates rebalance recommendations requiring explicit user approval before any real-world action.

Make the project production-quality with authentication, modular architecture, Docker, environment configuration, unit/integration tests, API documentation, structured logging, LangGraph agent tracing, error handling, sample financial data/mock APIs for development, AWS deployment configuration, comprehensive README, architecture diagram, seed data, and a polished responsive UI; clearly label the product as a research/simulation and decision-support tool rather than personalized financial advice.

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
