# Example R Scripts for DADM Statistical Analysis
# These scripts can be executed via the MCP Script Execution Service

# Decision Alternative Comparison using ANOVA and Tukey HSD
decision_alternative_statistical_test <- function(alternative_data) {
  # alternative_data should be a list with performance metrics for each alternative
  
  # Convert to data frame for analysis
  df <- data.frame(
    Alternative = rep(names(alternative_data), sapply(alternative_data, length)),
    Performance = unlist(alternative_data)
  )
  
  # Perform ANOVA
  anova_result <- aov(Performance ~ Alternative, data = df)
  anova_summary <- summary(anova_result)
  
  # Tukey HSD for pairwise comparisons if ANOVA is significant
  tukey_result <- NULL
  if (anova_summary[[1]][["Pr(>F)"]][1] < 0.05) {
    tukey_result <- TukeyHSD(anova_result)
  }
  
  # Calculate descriptive statistics by alternative
  desc_stats <- aggregate(Performance ~ Alternative, data = df, 
                         FUN = function(x) c(mean = mean(x), sd = sd(x), n = length(x)))
  
  return(list(
    anova = anova_summary,
    tukey_hsd = tukey_result,
    descriptive_stats = desc_stats,
    recommendation = if(!is.null(tukey_result)) {
      "Significant differences found between alternatives"
    } else {
      "No significant differences between alternatives"
    }
  ))
}

# Time Series Analysis for Trend Prediction
time_series_trend_analysis <- function(time_data, forecast_periods = 6) {
  library(forecast)
  
  # Convert to time series
  ts_data <- ts(time_data, frequency = 1)
  
  # Fit multiple models
  models <- list(
    linear = lm(time_data ~ seq_along(time_data)),
    arima = auto.arima(ts_data),
    exponential = ets(ts_data)
  )
  
  # Generate forecasts
  forecasts <- list(
    linear = predict(models$linear, newdata = data.frame(seq_along = (length(time_data) + 1):(length(time_data) + forecast_periods))),
    arima = forecast(models$arima, h = forecast_periods),
    exponential = forecast(models$exponential, h = forecast_periods)
  )
  
  # Model accuracy
  accuracy_metrics <- list(
    arima = accuracy(models$arima),
    exponential = accuracy(models$exponential)
  )
  
  return(list(
    original_data = time_data,
    models_fitted = names(models),
    forecasts = forecasts,
    accuracy = accuracy_metrics,
    trend_detected = summary(models$linear)$coefficients[2, 4] < 0.05  # p-value for slope
  ))
}

# Risk Factor Correlation Analysis
risk_correlation_analysis <- function(risk_matrix) {
  # risk_matrix should be a matrix where rows are observations and columns are risk factors
  
  # Calculate correlation matrix
  cor_matrix <- cor(risk_matrix, use = "complete.obs")
  
  # Test significance of correlations
  cor_test_results <- list()
  n_factors <- ncol(risk_matrix)
  
  for (i in 1:(n_factors-1)) {
    for (j in (i+1):n_factors) {
      test_result <- cor.test(risk_matrix[,i], risk_matrix[,j])
      cor_test_results[[paste0("factor_", i, "_vs_", j)]] <- list(
        correlation = test_result$estimate,
        p_value = test_result$p.value,
        significant = test_result$p.value < 0.05
      )
    }
  }
  
  # Principal Component Analysis for risk factor reduction
  pca_result <- prcomp(risk_matrix, scale. = TRUE)
  
  return(list(
    correlation_matrix = cor_matrix,
    correlation_tests = cor_test_results,
    pca = list(
      importance = summary(pca_result)$importance,
      loadings = pca_result$rotation,
      explained_variance = summary(pca_result)$importance[2,]
    )
  ))
}

# Cost Efficiency Analysis using Data Envelopment Analysis (DEA)
cost_efficiency_analysis <- function(inputs_matrix, outputs_matrix) {
  # Simple DEA analysis (would typically use specialized DEA package)
  
  n_units <- nrow(inputs_matrix)
  efficiency_scores <- numeric(n_units)
  
  # Simple ratio-based efficiency calculation
  for (i in 1:n_units) {
    input_ratio <- sum(inputs_matrix[i,]) / sum(inputs_matrix)
    output_ratio <- sum(outputs_matrix[i,]) / sum(outputs_matrix)
    efficiency_scores[i] <- output_ratio / input_ratio
  }
  
  # Normalize to 0-1 scale
  efficiency_scores <- efficiency_scores / max(efficiency_scores)
  
  # Identify efficient and inefficient units
  efficient_threshold <- 0.95
  efficient_units <- which(efficiency_scores >= efficient_threshold)
  
  return(list(
    efficiency_scores = efficiency_scores,
    efficient_units = efficient_units,
    mean_efficiency = mean(efficiency_scores),
    efficiency_distribution = summary(efficiency_scores),
    benchmark_units = efficient_units[1:min(3, length(efficient_units))]
  ))
}

# Stakeholder Satisfaction Analysis
stakeholder_satisfaction_analysis <- function(satisfaction_data, stakeholder_weights = NULL) {
  # satisfaction_data: matrix where rows are stakeholders, columns are satisfaction dimensions
  
  if (is.null(stakeholder_weights)) {
    stakeholder_weights <- rep(1/nrow(satisfaction_data), nrow(satisfaction_data))
  }
  
  # Overall satisfaction index
  overall_satisfaction <- apply(satisfaction_data, 1, mean)
  weighted_overall <- weighted.mean(overall_satisfaction, stakeholder_weights)
  
  # Identify critical satisfaction dimensions
  dimension_importance <- apply(satisfaction_data, 2, function(x) cor(x, overall_satisfaction))
  
  # Satisfaction gaps analysis
  max_possible <- max(satisfaction_data)  # Assuming satisfaction scale
  satisfaction_gaps <- max_possible - satisfaction_data
  critical_gaps <- which(satisfaction_gaps > quantile(satisfaction_gaps, 0.75), arr.ind = TRUE)
  
  return(list(
    individual_satisfaction = overall_satisfaction,
    weighted_overall_satisfaction = weighted_overall,
    dimension_importance = dimension_importance,
    critical_gaps = critical_gaps,
    satisfaction_summary = summary(overall_satisfaction),
    recommendation = if (weighted_overall < 0.7 * max_possible) {
      "Significant satisfaction improvements needed"
    } else {
      "Satisfaction levels are acceptable"
    }
  ))
}

# Example usage - uncomment to test
# cat("Running statistical analysis examples...\n")

# Example 1: Decision Alternative Testing
# alternatives <- list(
#   A = c(85, 90, 88, 92, 87),
#   B = c(78, 82, 85, 80, 83),
#   C = c(92, 89, 91, 94, 88)
# )
# result1 <- decision_alternative_statistical_test(alternatives)
# cat("Decision Alternative Analysis Complete\n")

# Example 2: Time Series Analysis
# time_data <- c(100, 110, 105, 115, 120, 118, 125, 130, 128, 135, 140, 138)
# result2 <- time_series_trend_analysis(time_data, 3)
# cat("Time Series Analysis Complete\n")

# Example 3: Risk Correlation
# risk_data <- matrix(rnorm(50*4), ncol=4)  # 4 risk factors, 50 observations
# result3 <- risk_correlation_analysis(risk_data)
# cat("Risk Correlation Analysis Complete\n")

cat("R Statistical Analysis Scripts Loaded Successfully\n")
