package com.logitrack.backendapi.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ApiErrorResponse> handleNotFound(
      ResourceNotFoundException exception,
      HttpServletRequest request
  ) {
    return build(HttpStatus.NOT_FOUND, exception.getMessage(), request);
  }

  @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class})
  public ResponseEntity<ApiErrorResponse> handleBadRequest(
      Exception exception,
      HttpServletRequest request
  ) {
    return build(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
  }

  private ResponseEntity<ApiErrorResponse> build(
      HttpStatus status,
      String message,
      HttpServletRequest request
  ) {
    ApiErrorResponse response = new ApiErrorResponse(
        status.getReasonPhrase(),
        message,
        request.getRequestURI(),
        OffsetDateTime.now()
    );
    return ResponseEntity.status(status).body(response);
  }
}
