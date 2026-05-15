# AMBRA CANONICAL MOCK DATA

This directory contains verified datasets for testing AMBRA integrations.
These files represent the "Golden Standard" for the V2 architecture.

## Files

1. `locations_full.json`: A massive logical location tree covering 4 warehouses.
2. `workspace_simple_wh.json`: Basic Top-Down layout.
3. `workspace_advanced_front.json`: Complex front-view rack with dividers and skins.
4. `workspace_infrastructure.json`: Wall/Pillar/Obstacle layout.
5. `workspace_scoping_test.json`: Scoped layouts verifying boundary enforcement.
6. `workspace_invalid_diagnostics.json`: Intentionally broken data for testing the Health Report.

## Usage

Import these into the Workspace Data Dialog or use them as seed data for the database.
All IDs are canonical across the files where mappings are referenced.
