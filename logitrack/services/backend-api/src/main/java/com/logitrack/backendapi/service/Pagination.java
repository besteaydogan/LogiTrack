package com.logitrack.backendapi.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class Pagination {

  public static final int DEFAULT_PAGE = 1;
  public static final int DEFAULT_PAGE_SIZE = 10;
  public static final int MAX_PAGE_SIZE = 100;

  private Pagination() {
  }

  public static Pageable pageable(Integer page, Integer pageSize, Sort sort) {
    int resolvedPage = page == null || page < 1 ? DEFAULT_PAGE : page;
    int resolvedPageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
    int cappedPageSize = Math.min(resolvedPageSize, MAX_PAGE_SIZE);
    return PageRequest.of(resolvedPage - 1, cappedPageSize, sort);
  }
}
