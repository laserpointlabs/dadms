## Docker Environment Variables

When using Docker environment variables, it's important to use the correct syntax for variable substitution. In Docker Compose files, here are two common patterns:

### Direct Variable Substitution

For simple variables in the `environment` section:
```yaml
environment:
  - VARIABLE_NAME=${ENV_VAR:-default_value}
```

### Command with Variable Substitution

For variables used in commands, you need to escape the `$` with another `$` and use a shell:
```yaml
command: sh -c "some_command --param $${ENV_VAR:-default_value}"
```

Note the double dollar sign (`$$`), which is necessary because Docker Compose first processes the variable, then the shell.

### Troubleshooting

If you encounter errors like:
```
error: argument --interval/-i: invalid int value: '${CHECK_INTERVAL:-60}'
```

This usually means Docker is passing the raw variable syntax to the command instead of the evaluated value. Use the shell pattern described above to fix this issue.