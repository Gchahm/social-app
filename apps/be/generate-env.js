#!/usr/bin/env node
/**
 * Generates env.json from the synthesized CloudFormation template
 * Automatically discovers all Lambda functions and applies shared environment variables
 * Run this script whenever you need to update env.json for SAM local testing
 */
const fs = require('fs');
const path = require('path');

try {
  const config = require('./env.config.js');

  // Read the synthesized CloudFormation template
  const templatePath = path.join(__dirname, 'cdk.out', 'BEStack.template.json');

  if (!fs.existsSync(templatePath)) {
    console.error('✗ CloudFormation template not found!');
    console.error('  Run "npx nx synth be" first to generate the template');
    process.exit(1);
  }

  const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
  const envJson = {};

  // Find all Lambda functions in the template
  const resources = template.Resources || {};
  const lambdaIds = Object.keys(resources).filter(
    id => resources[id].Type === 'AWS::Lambda::Function'
  );

  if (lambdaIds.length === 0) {
    console.warn('⚠ No Lambda functions found in the template');
    process.exit(0);
  }

  // Apply shared variables to all Lambda functions
  lambdaIds.forEach(lambdaId => {
    envJson[lambdaId] = { ...config.shared };

    // Apply any Lambda-specific overrides
    if (config.overrides && config.overrides[lambdaId]) {
      Object.assign(envJson[lambdaId], config.overrides[lambdaId]);
    }
  });

  // Write to env.json
  const outputPath = path.join(__dirname, 'env.json');
  fs.writeFileSync(outputPath, JSON.stringify(envJson, null, 2) + '\n');

  console.log('✓ env.json generated successfully!');
  console.log(`  ${lambdaIds.length} Lambda function(s) configured:`);
  lambdaIds.forEach(id => console.log(`    - ${id}`));
  console.log(`  Shared variables: ${Object.keys(config.shared).join(', ')}`);
} catch (error) {
  console.error('✗ Failed to generate env.json:', error.message);
  process.exit(1);
}