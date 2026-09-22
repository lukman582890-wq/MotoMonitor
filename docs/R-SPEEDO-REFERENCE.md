# R-Speedo reference for MotoMonitor

MotoMonitor uses the public R-Speedo documentation as a product/design reference.

Source:
- Repository: rasyid-irsyadi/r-speedo.app
- Reference documentation: `docs/layouts.md`, `docs/product.md`
- Source license: CC BY 4.0

The referenced repository is a documentation/knowledge-base repository rather than the R-Speedo application source code. MotoMonitor therefore does not copy proprietary application source. Instead, this project implements its own UI and telemetry code around the documented concepts.

## Design direction

MotoMonitor follows the documented principle that dashboard layouts change presentation while keeping the underlying telemetry state consistent.

Initial layout targets:
1. Tesla-style everyday cockpit
2. Sloped cockpit
3. Gecit-style cockpit
4. Tilano-style cockpit
5. Tech Lab
6. Route/navigation
7. Motovlog
8. Dragger
9. Road Dyno
10. Custom Canvas

The existing MotoMonitor telemetry adapters remain the source of truth for BMS, VOTOL and GPS data.

Attribution: R-Speedo documentation by rasyid-irsyadi, licensed under CC BY 4.0.
