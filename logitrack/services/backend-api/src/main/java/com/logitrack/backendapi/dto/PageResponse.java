package com.logitrack.backendapi.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

public record PageResponse<T>(
    List<T> items,
    int page,
    int pageSize,
    long totalItems,
    int totalPages
) {

  public static <T, R> PageResponse<R> from(Page<T> page, Function<T, R> mapper) {
    return new PageResponse<>(
        page.getContent().stream().map(mapper).toList(),
        page.getNumber() + 1,
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages()
    );
  }
}
