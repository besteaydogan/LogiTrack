package com.logitrack.backendapi.controller;

import com.logitrack.backendapi.dto.PageResponse;
import com.logitrack.backendapi.dto.WarehouseDto;
import com.logitrack.backendapi.service.WarehouseService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.isNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WarehouseController.class)
class WarehouseControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private WarehouseService warehouseService;

  @Test
  void returnsSeededWarehouseShape() throws Exception {
    Mockito.when(warehouseService.list(isNull(), isNull()))
        .thenReturn(new PageResponse<>(
            List.of(new WarehouseDto("WH-ANK-01", "Ankara Main Hub", "Ankara", "Cankaya", 39.9208, 32.8541, 180)),
            1,
            20,
            1,
            1
        ));

    mockMvc.perform(get("/api/warehouses"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].id").value("WH-ANK-01"))
        .andExpect(jsonPath("$.items[0].latitude").value(39.9208))
        .andExpect(jsonPath("$.items[0].longitude").value(32.8541))
        .andExpect(jsonPath("$.items[0].capacity").value(180));
  }
}
