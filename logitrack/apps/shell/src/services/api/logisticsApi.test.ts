import {
  getAlerts,
  getAlertsBySeverity,
  getAnalyticsSummary,
  getDashboardSummary,
  getDeliveries,
  getVehicles,
  resolveAlert,
} from './logisticsApi';

const jsonResponse = {};

function mockFetch() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(jsonResponse),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('logistics API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests dashboard, delivery, alert, and vehicle resources with GET', async () => {
    const fetchMock = mockFetch();

    await getDashboardSummary();
    await getDeliveries();
    await getAlerts();
    await getVehicles();

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:8080/api/dashboard/summary', expect.objectContaining({ method: 'GET' }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:8080/api/deliveries', expect.objectContaining({ method: 'GET' }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'http://localhost:8080/api/alerts', expect.objectContaining({ method: 'GET' }));
    expect(fetchMock).toHaveBeenNthCalledWith(4, 'http://localhost:8080/api/vehicles', expect.objectContaining({ method: 'GET' }));
  });

  it('builds alert severity queries and resolve PATCH requests', async () => {
    const fetchMock = mockFetch();

    await getAlertsBySeverity('ALL');
    await getAlertsBySeverity('CRITICAL');
    await resolveAlert('ALT-001');

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:8080/api/alerts', expect.objectContaining({ method: 'GET' }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:8080/api/alerts?severity=CRITICAL', expect.objectContaining({ method: 'GET' }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'http://localhost:8080/api/alerts/ALT-001/resolve', expect.objectContaining({ method: 'PATCH' }));
  });

  it('builds analytics query parameters from filters', async () => {
    const fetchMock = mockFetch();

    await getAnalyticsSummary({});
    await getAnalyticsSummary({ from: '2026-05-01', to: '2026-05-25', region: 'Ankara Cankaya' });

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:8080/api/analytics/summary', expect.objectContaining({ method: 'GET' }));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8080/api/analytics/summary?from=2026-05-01&to=2026-05-25&region=Ankara+Cankaya',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
