# MCP Statistical Server - Testing Guide

## Simple Instructions to Test the `calculate_statistics` Endpoint

### Quick Test Commands

1. **Run the basic test script:**
   ```powershell
   python test_statistical_server.py
   ```

2. **Interactive Python testing:**
   ```python
   import asyncio
   from mcp_servers.mcp_statistical_server import calculate_statistics
   
   # Simple test
   test_data = {"data": [1, 2, 3, 4, 5]}
   result = await calculate_statistics(test_data)
   print(result[0].text)
   ```

### Input Parameters

The `calculate_statistics` function accepts:

- **`data`** (required): Array of numerical values
  - Example: `[1, 2, 3, 4, 5]`
  - Can include integers or floats
  - Must have at least 1 data point

- **`include_distribution_tests`** (optional): Boolean
  - `true` (default): Includes normality tests (Shapiro-Wilk, Anderson-Darling)
  - `false`: Only basic statistics
  - Requires at least 3 data points for tests

### Output Statistics

The function returns:

#### Basic Statistics:
- **count**: Number of data points
- **mean**: Average value
- **median**: Middle value
- **std**: Standard deviation
- **var**: Variance
- **min/max**: Minimum and maximum values
- **range**: Difference between max and min
- **skewness**: Measure of asymmetry
- **kurtosis**: Measure of tail heaviness
- **percentiles**: 25th, 50th, 75th, and 95th percentiles

#### Distribution Tests (when enabled):
- **normality_test**: Shapiro-Wilk test results
  - `statistic`: Test statistic
  - `p_value`: P-value
  - `is_normal`: Whether data appears normally distributed
- **anderson_darling**: Anderson-Darling test for normality
  - `statistic`: Test statistic
  - `critical_values`: Critical values for different significance levels
  - `significance_levels`: Corresponding significance levels

### Test Examples

1. **Normal-like data:**
   ```json
   {"data": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
   ```

2. **Larger dataset:**
   ```json
   {"data": [12, 15, 18, 22, 25, 28, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]}
   ```

3. **Decimal values:**
   ```json
   {"data": [1.5, 2.7, 3.2, 4.8, 5.1, 6.9, 7.3, 8.6, 9.2, 10.4]}
   ```

4. **Without distribution tests:**
   ```json
   {"data": [100, 200, 150], "include_distribution_tests": false}
   ```

### Quick Validation

- ✅ Function works with integers and floats
- ✅ Handles small datasets (minimum 1 point)
- ✅ Distribution tests require minimum 3 points
- ✅ Returns JSON-serializable results
- ✅ Includes comprehensive statistical measures

### Common Issues

1. **Empty data array**: Will cause an error
2. **Non-numeric data**: Will cause an error
3. **Less than 3 points with distribution tests**: Tests will be skipped

### Integration Testing

To test as an actual MCP server, you would need to:
1. Start the server: `python mcp_statistical_server.py`
2. Connect an MCP client
3. Call the `calculate_statistics` tool with proper MCP protocol

The test script above directly tests the core function logic without the MCP protocol layer.
