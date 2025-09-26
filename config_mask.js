#!/usr/bin/env node

/**
 * Schedule Configuration Mask Calculator
 * 
 * This tool calculates the bitmap value for Schedule configuration flags.
 * It can be used to manually set configuration values in the database.
 * 
 * Usage:
 *   node config_mask.js [configs...]
 * 
 * Examples:
 *   node config_mask.js RUN_ON_HOLIDAY RUN_ON_HOLIDAY_EVE
 *   node config_mask.js RUN_ON_HOLIDAY_EVE
 *   node config_mask.js RUN_ON_HOLIDAY
 *   node config_mask.js
 * 
 * Available configs:
 *   RUN_ON_HOLIDAY      - Schedule runs on holidays
 *   RUN_ON_HOLIDAY_EVE  - Schedule runs on holiday eves
 */

// Import the ScheduleConfigFlag enum from the TypeScript file
// Since this is a JS file, we'll define the enum values here to match the TS file
// 
// TO ADD NEW CONFIG FLAGS:
// 1. Add the new flag to ScheduleConfigFlag enum in src/datasource/entities/ScheduleConfig.ts
// 2. Add the same flag here with the next available bit position (1 << 2, 1 << 3, etc.)
// 3. The tool will automatically support the new flag
const ScheduleConfigFlag = {
  RUN_ON_HOLIDAY: 1 << 0,        // 1
  RUN_ON_HOLIDAY_EVE: 1 << 1,    // 2
  // Future flags can be added here:
  // RUN_ON_WEEKENDS: 1 << 2,    // 4
  // RUN_ON_SPECIAL_DAYS: 1 << 3, // 8
};

// Helper function to calculate the config mask
function calculateConfigMask(configNames) {
  let mask = 0;
  const validConfigs = [];
  const invalidConfigs = [];
  
  for (const configName of configNames) {
    if (ScheduleConfigFlag.hasOwnProperty(configName)) {
      mask |= ScheduleConfigFlag[configName];
      validConfigs.push(configName);
    } else {
      invalidConfigs.push(configName);
    }
  }
  
  return { mask, validConfigs, invalidConfigs };
}

// Helper function to show available configs
function showAvailableConfigs() {
  console.log('\nAvailable configuration flags:');
  console.log('  RUN_ON_HOLIDAY      - Schedule runs on holidays (value: 1)');
  console.log('  RUN_ON_HOLIDAY_EVE  - Schedule runs on holiday eves (value: 2)');
  console.log('\nFuture flags will be automatically supported when added to both:');
  console.log('  - ScheduleConfigFlag enum in src/datasource/entities/ScheduleConfig.ts');
  console.log('  - ScheduleConfigFlag object in this tool (config_mask.js)');
}

// Helper function to show usage
function showUsage() {
  console.log('Schedule Configuration Mask Calculator');
  console.log('');
  console.log('Usage:');
  console.log('  node config_mask.js [configs...]');
  console.log('');
  console.log('Examples:');
  console.log('  node config_mask.js RUN_ON_HOLIDAY RUN_ON_HOLIDAY_EVE');
  console.log('  node config_mask.js RUN_ON_HOLIDAY_EVE');
  console.log('  node config_mask.js RUN_ON_HOLIDAY');
  console.log('  node config_mask.js --help');
  console.log('  node config_mask.js --list');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('  --list, -l    List all available configuration flags');
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  // Handle help flags
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    if (args.includes('--list') || args.includes('-l')) {
      showAvailableConfigs();
    }
    return;
  }
  
  // Handle list flag
  if (args.includes('--list') || args.includes('-l')) {
    showAvailableConfigs();
    return;
  }
  
  // Filter out flags and get only config names
  const configNames = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
  
  if (configNames.length === 0) {
    console.error('Error: No configuration flags provided.');
    console.log('Use --help to see usage information.');
    process.exit(1);
  }
  
  // Calculate the mask
  const { mask, validConfigs, invalidConfigs } = calculateConfigMask(configNames);
  
  // Show results
  console.log('Schedule Configuration Mask Calculator');
  console.log('=====================================');
  console.log('');
  
  if (validConfigs.length > 0) {
    console.log('Valid configurations:');
    validConfigs.forEach(config => {
      const value = ScheduleConfigFlag[config];
      console.log(`  ${config} (${value})`);
    });
    console.log('');
    console.log(`Calculated mask value: ${mask}`);
    console.log('');
    console.log('SQL Usage:');
    console.log(`  UPDATE schedules SET config = ${mask} WHERE id = <schedule_id>;`);
    console.log(`  INSERT INTO schedules (..., config) VALUES (..., ${mask});`);
  }
  
  if (invalidConfigs.length > 0) {
    console.log('');
    console.error('Invalid configurations:');
    invalidConfigs.forEach(config => {
      console.error(`  ${config} (not found)`);
    });
    console.log('');
    console.log('Use --list to see all available configuration flags.');
    process.exit(1);
  }
  
  // Show binary representation for debugging
  console.log('');
  console.log('Binary representation:');
  console.log(`  ${mask.toString(2).padStart(8, '0')} (binary)`);
  console.log(`  ${mask.toString(16).toUpperCase().padStart(2, '0')} (hex)`);
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  calculateConfigMask,
  ScheduleConfigFlag,
  showAvailableConfigs,
  showUsage
};
