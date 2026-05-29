package com.logitrack.backendapi.service;

import com.logitrack.backendapi.dto.ServerMetricsMessage;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.RuntimeMXBean;
import java.lang.management.ThreadMXBean;
import java.time.OffsetDateTime;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class ServerMetricsService {

  private final AtomicLong sequence = new AtomicLong();
  private final OperatingSystemMXBean operatingSystem = ManagementFactory.getOperatingSystemMXBean();
  private final Runtime runtime = Runtime.getRuntime();
  private final RuntimeMXBean runtimeMxBean = ManagementFactory.getRuntimeMXBean();
  private final ThreadMXBean threadMxBean = ManagementFactory.getThreadMXBean();

  public ServerMetricsMessage snapshot() {
    long maxMemory = runtime.maxMemory();
    long usedMemory = runtime.totalMemory() - runtime.freeMemory();

    return new ServerMetricsMessage(
        "server.metrics",
        OffsetDateTime.now(),
        cpuUsagePercent(),
        usedMemory,
        maxMemory,
        percent(usedMemory, maxMemory),
        threadMxBean.getThreadCount(),
        runtimeMxBean.getUptime() / 1000,
        sequence.incrementAndGet()
    );
  }

  private double cpuUsagePercent() {
    if (operatingSystem instanceof com.sun.management.OperatingSystemMXBean sunOperatingSystem) {
      double cpuLoad = sunOperatingSystem.getCpuLoad();

      if (cpuLoad >= 0) {
        return round(cpuLoad * 100);
      }
    }

    double loadAverage = operatingSystem.getSystemLoadAverage();
    int processors = Math.max(1, operatingSystem.getAvailableProcessors());
    return loadAverage < 0 ? 0 : round(Math.min(100, (loadAverage / processors) * 100));
  }

  private double percent(long value, long total) {
    if (total <= 0) {
      return 0;
    }

    return round(((double) value / total) * 100);
  }

  private double round(double value) {
    return Math.round(value * 10.0) / 10.0;
  }
}
