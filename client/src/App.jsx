import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, AlertCircle, CheckCircle, Activity } from "lucide-react";

const API_URL = "http://localhost:3000/api";

export default function App() {
  const [userId, setUserId] = useState("");
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculateScore = async () => {
    if (!userId.trim()) {
      setError("Please enter a User ID");
      return;
    }

    setLoading(true);
    setError("");
    setScoreData(null);

    try {
      const response = await fetch(`${API_URL}/credit/score/${userId.trim()}`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setScoreData(data);
        setError("");
      } else {
        setError(data.error || "Failed to calculate score");
        setScoreData(null);
      }
    } catch (err) {
      setError(
        "Failed to connect to backend. Make sure server is running on port 3000."
      );
      console.log(err);
      setScoreData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      calculateScore();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-900 rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-one text-gray-900">
                Credit Score Calculator
              </h1>
              <p className="text-base text-gray-600">
                Alternative credit scoring for SMEs
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="mb-6">
            <label
              htmlFor="userId"
              className="block text-base font-semibold text-gray-700 mb-2"
            >
              Enter User ID
            </label>
            <div className="flex gap-3">
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., 673171f7cc6e0e69f0ae8cb4"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={loading}
              />
              <button
                onClick={calculateScore}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-900 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    <span>Calculate Score</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Helper Text */}
          {!scoreData && !error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-base text-red-800">
                <strong className="font-one">Available UserIds</strong> <br />
                <strong>UserId 1:</strong> 691ef4e3c0b6fcb47131f978 <br />
                <strong>UserId 2:</strong> 691ef4e3c0b6fcb47131f97a <br />
                <strong>UserId 3:</strong> 691ef4e3c0b6fcb47131f97b <br />
                <strong>UserId 4:</strong> 691ef4e3c0b6fcb47131f97c <br />
                <strong>UserId 5:</strong> 691ef4e3c0b6fcb47131f979
              </p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {scoreData && (
          <div className="space-y-6 animate-fade-in">
            {/* Score Overview Card */}
            <div className="bg-gradient-to-br from-red-600 to-red-900 rounded-2xl shadow-lg p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    {scoreData.user.name}
                  </h2>
                  <p className="text-blue-100">
                    {scoreData.user.businessType} •{" "}
                    {scoreData.user.accountNumber}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-7xl font-bold mb-2">
                    {scoreData.creditScore.score}
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <span className="px-4 py-1 bg-white bg-opacity-20 rounded-full text-lg font-semibold">
                      Grade {scoreData.creditScore.grade}
                    </span>
                    <span
                      className={`px-4 py-1 rounded-full text-lg font-semibold ${
                        scoreData.creditScore.riskLevel === "Low"
                          ? "bg-green-500"
                          : scoreData.creditScore.riskLevel === "Medium"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    >
                      {scoreData.creditScore.riskLevel} Risk
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white bg-opacity-20 rounded-full h-4">
                <div
                  className="bg-white rounded-full h-4 transition-all duration-1000 ease-out"
                  style={{
                    width: `${
                      ((scoreData.creditScore.score - 300) / 550) * 100
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-sm mt-2 text-blue-100 font-medium">
                <span>300</span>
                <span>850</span>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900">
                  <Activity className="w-6 h-6 mr-2 text-red-600" />
                  Score Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={[
                      {
                        name: "Transaction",
                        score: scoreData.breakdown.transaction,
                      },
                      {
                        name: "Cash Flow",
                        score: scoreData.breakdown.cashFlow,
                      },
                      {
                        name: "Stability",
                        score: scoreData.breakdown.stability,
                      },
                      {
                        name: "Behavior",
                        score: scoreData.breakdown.behavior,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#6b7280" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="score" fill="rgb(220, 38, 38)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Component Scores */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold mb-6 text-gray-900">
                  Component Details
                </h3>
                <div className="space-y-5">
                  {[
                    {
                      label: "Transaction Score",
                      value: scoreData.breakdown.transaction,
                      weight: "30%",
                    },
                    {
                      label: "Cash Flow Score",
                      value: scoreData.breakdown.cashFlow,
                      weight: "35%",
                    },
                    {
                      label: "Stability Score",
                      value: scoreData.breakdown.stability,
                      weight: "20%",
                    },
                    {
                      label: "Behavior Score",
                      value: scoreData.breakdown.behavior,
                      weight: "15%",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {item.label}
                          <span className="ml-2 text-xs text-gray-500">
                            ({item.weight})
                          </span>
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {item.value}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-red-500 to-red-800 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center text-gray-900">
                <AlertCircle className="w-6 h-6 mr-2 text-orange-600" />
                Improvement Recommendations
              </h3>
              {scoreData.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {scoreData.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-800 font-medium">{rec}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-green-800">
                      Excellent Performance!
                    </p>
                    <p className="text-sm text-green-700">
                      Continue maintaining your current financial practices.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Calculate Another Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setUserId("");
                  setScoreData(null);
                  setError("");
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Calculate Another Score
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
