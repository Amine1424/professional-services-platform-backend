import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import ProviderMediaComment from '../models/ProviderMediaComment';
import ProviderPreference from '../models/ProviderPreference';
import ProviderReview from '../models/ProviderReview';
import Service from '../models/Service';
import ServiceProvider from '../models/ServiceProvider';
import ServiceRequest from '../models/ServiceRequest';
import User from '../models/User';

const router = Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const buildSummary = async () => {
  const userRepo = AppDataSource.getRepository(User);
  const providerRepo = AppDataSource.getRepository(ServiceProvider);
  const serviceRepo = AppDataSource.getRepository(Service);
  const requestRepo = AppDataSource.getRepository(ServiceRequest);
  const reviewRepo = AppDataSource.getRepository(ProviderReview);
  const commentRepo = AppDataSource.getRepository(ProviderMediaComment);
  const prefRepo = AppDataSource.getRepository(ProviderPreference);

  const [
    totalUsers,
    totalCustomers,
    totalProvidersUsers,
    totalReviewers,
    totalAdmins,
    totalProviders,
    pendingProviders,
    approvedProviders,
    suspendedProviders,
    totalServices,
    totalRequests,
    totalReviews,
    totalComments,
    preferences,
    latestRequests,
  ] = await Promise.all([
    userRepo.count(),
    userRepo.count({ where: { role: 'customer' as any } }),
    userRepo.count({ where: { role: 'service_provider' as any } }),
    userRepo.count({ where: { role: 'reviewer' as any } }),
    userRepo.count({ where: { role: 'admin' as any } }),
    providerRepo.count(),
    providerRepo.count({ where: { status: 'pending' as any } }),
    providerRepo.count({ where: { status: 'approved' as any } }),
    providerRepo.count({ where: { status: 'suspended' as any } }),
    serviceRepo.count(),
    requestRepo.count(),
    reviewRepo.count(),
    commentRepo.count(),
    prefRepo.find(),
    requestRepo.find({
      relations: ['customer', 'provider', 'service'],
      order: { createdAt: 'DESC' },
      take: 10,
    }),
  ]);

  const planMap: Record<string, number> = {};
  preferences.forEach((item) => {
    planMap[item.selectedPlan] = (planMap[item.selectedPlan] || 0) + 1;
  });

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      totalUsers,
      totalCustomers,
      totalProvidersUsers,
      totalReviewers,
      totalAdmins,
      totalProviders,
      pendingProviders,
      approvedProviders,
      suspendedProviders,
      totalServices,
      totalRequests,
      totalReviews,
      totalComments,
    },
    distributions: {
      providerStatuses: [
        { label: 'pending', value: pendingProviders },
        { label: 'approved', value: approvedProviders },
        { label: 'suspended', value: suspendedProviders },
      ],
      plans: Object.entries(planMap).map(([label, value]) => ({
        label,
        value,
      })),
      roles: [
        { label: 'customer', value: totalCustomers },
        { label: 'service_provider', value: totalProvidersUsers },
        { label: 'reviewer', value: totalReviewers },
        { label: 'admin', value: totalAdmins },
      ],
    },
    latestRequests: latestRequests.map((item) => ({
      id: item.id,
      subject: item.subject,
      status: item.status,
      quotedPrice: item.quotedPrice,
      currencyCode: item.currencyCode,
      customerName: item.customer
        ? `${item.customer.firstName} ${item.customer.lastName}`.trim()
        : 'N/A',
      providerName: item.provider?.companyName || 'N/A',
      serviceName: item.service?.name || 'N/A',
      createdAt: item.createdAt,
    })),
  };
};

router.get(
  '/summary',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      const summary = await buildSummary();

      res.status(200).json({
        status: 'success',
        message: 'Reports summary fetched successfully',
        data: summary,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch reports summary',
      });
    }
  }
);

router.get(
  '/export/excel',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      const summary = await buildSummary();

      const workbook = new ExcelJS.Workbook();

      const overview = workbook.addWorksheet('Overview');
      overview.columns = [
        { header: 'Metric', key: 'metric', width: 32 },
        { header: 'Value', key: 'value', width: 18 },
      ];

      Object.entries(summary.kpis).forEach(([metric, value]) => {
        overview.addRow({ metric, value });
      });

      const rolesSheet = workbook.addWorksheet('Roles');
      rolesSheet.columns = [
        { header: 'Role', key: 'label', width: 28 },
        { header: 'Count', key: 'value', width: 18 },
      ];
      summary.distributions.roles.forEach((row) => rolesSheet.addRow(row));

      const providersSheet = workbook.addWorksheet('Provider Status');
      providersSheet.columns = [
        { header: 'Status', key: 'label', width: 28 },
        { header: 'Count', key: 'value', width: 18 },
      ];
      summary.distributions.providerStatuses.forEach((row) => providersSheet.addRow(row));

      const plansSheet = workbook.addWorksheet('Plans');
      plansSheet.columns = [
        { header: 'Plan', key: 'label', width: 28 },
        { header: 'Count', key: 'value', width: 18 },
      ];
      summary.distributions.plans.forEach((row) => plansSheet.addRow(row));

      const latestRequestsSheet = workbook.addWorksheet('Latest Requests');
      latestRequestsSheet.columns = [
        { header: 'Subject', key: 'subject', width: 30 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Quoted Price', key: 'quotedPrice', width: 18 },
        { header: 'Currency', key: 'currencyCode', width: 14 },
        { header: 'Customer', key: 'customerName', width: 24 },
        { header: 'Provider', key: 'providerName', width: 24 },
        { header: 'Service', key: 'serviceName', width: 24 },
        { header: 'Created At', key: 'createdAt', width: 28 },
      ];
      summary.latestRequests.forEach((row) => latestRequestsSheet.addRow(row));

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="admin-reports.xlsx"'
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to export Excel report',
      });
    }
  }
);

router.get(
  '/export/pdf',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      const summary = await buildSummary();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="admin-reports.pdf"');

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(res);

      doc.fontSize(20).text('Admin Reports Summary');
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Generated at: ${summary.generatedAt}`);
      doc.moveDown();

      doc.fontSize(16).text('KPIs');
      doc.moveDown(0.5);

      Object.entries(summary.kpis).forEach(([metric, value]) => {
        doc.fontSize(11).text(`${metric}: ${value}`);
      });

      doc.moveDown();
      doc.fontSize(16).text('Plan Distribution');
      doc.moveDown(0.5);

      summary.distributions.plans.forEach((item) => {
        doc.fontSize(11).text(`${item.label}: ${item.value}`);
      });

      doc.moveDown();
      doc.fontSize(16).text('Provider Status Distribution');
      doc.moveDown(0.5);

      summary.distributions.providerStatuses.forEach((item) => {
        doc.fontSize(11).text(`${item.label}: ${item.value}`);
      });

      doc.moveDown();
      doc.fontSize(16).text('Latest Requests');
      doc.moveDown(0.5);

      summary.latestRequests.forEach((item, index) => {
        doc
          .fontSize(11)
          .text(
            `${index + 1}. ${item.subject || 'Request'} | ${item.status} | ${item.customerName} -> ${item.providerName}`
          );
      });

      doc.end();
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to export PDF report',
      });
    }
  }
);

export default router;