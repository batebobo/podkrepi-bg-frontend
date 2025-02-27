import { useState } from 'react'
import { styled } from '@mui/material/styles'
import { useTranslation } from 'next-i18next'
import { CampaignResponse } from 'gql/campaigns'
import { baseUrl, routes } from 'common/routes'
import { moneyPublic } from 'common/util/money'
import CampaignProgress from './CampaignProgress'
import DonorsAndDonations from './DonorsAndDonations'
import { Button, CircularProgress, Grid, IconButton, Menu, Typography } from '@mui/material'
import { lighten } from '@mui/material/styles'
import { AddLinkOutlined, Favorite } from '@mui/icons-material'
import ShareIcon from '@mui/icons-material/Share'
import { useCampaignDonationHistory } from 'common/hooks/campaigns'
import theme from 'common/theme'
import { useRouter } from 'next/router'
import CustomListItem from 'components/admin/navigation/CustomListItem'
import { socialMedia } from './helpers/socialMedia'
import { useCopyToClipboard } from 'common/util/useCopyToClipboard'
import { AlertStore } from 'stores/AlertStore'
import useMobile from 'common/hooks/useMobile'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import LinkButton from '../common/LinkButton'
import { CampaignState } from './helpers/campaign.enums'
const PREFIX = 'InlineDonation'

const classes = {
  inlineDonationWrapper: `${PREFIX}-inlineDonationWrapper`,
  reachedMoney: `${PREFIX}-reachedMoney`,
  targetMoney: `${PREFIX}-targetMoney`,
  donorsSharesCount: `${PREFIX}-donorsSharesCount`,
  donationPriceList: `${PREFIX}-donationPriceList`,
  dropdownLinkButton: `${PREFIX}-dropdownLinkButton`,
  dropdownLinkText: `${PREFIX}-dropdownLinkText`,
  buttonContainer: `${PREFIX}-buttonContainer`,
  sharesContainer: `${PREFIX}-sharesContainer`,
  openButton: `${PREFIX}-openButton`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`&.${classes.inlineDonationWrapper}`]: {
    backgroundColor: '#EEEEEE',
    borderRadius: theme.spacing(1),
    height: 'fit-content',
    boxShadow: '2px 4px 5px rgba(0, 0, 0, 0.25)',
    [theme.breakpoints.down('md')]: {
      margin: theme.spacing(0),
      borderRadius: theme.spacing(0),
    },
  },

  [`& .${classes.reachedMoney}`]: {
    fontSize: theme.spacing(5),
    fontWeight: 500,
    [theme.breakpoints.down('md')]: {
      fontSize: theme.spacing(3),
    },
  },

  [`& .${classes.targetMoney}`]: {
    fontSize: theme.spacing(3),
    [theme.breakpoints.down('md')]: {
      fontSize: theme.spacing(2),
    },
  },

  [`& .${classes.donorsSharesCount}`]: {
    fontWeight: 'bold',
    fontSize: theme.spacing(2),
  },

  [`& .${classes.donationPriceList}`]: {
    display: 'contents',
    textAlignLast: 'center',
  },

  [`& .${classes.dropdownLinkButton}`]: {
    '&:hover': {
      backgroundColor: lighten(theme.palette.primary.main, 0.9),
    },
  },

  [`& .${classes.dropdownLinkText}`]: {
    color: theme.palette.primary.dark,
    width: '100%',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },

  [`& .${classes.buttonContainer}`]: {
    [theme.breakpoints.down('md')]: {
      display: 'flex',
      flexWrap: 'nowrap',
      marginTop: theme.spacing(2),
    },
  },

  [`& .${classes.sharesContainer}`]: {
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },

  [`& .${classes.openButton}`]: {
    textAlign: 'center',
    marginBottom: `-${theme.spacing(7)}`,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#EEEEEE',
    minWidth: theme.spacing(5),
    paddingBottom: 'unset',
  },
}))

type Props = {
  campaign: CampaignResponse
}

export default function InlineDonation({ campaign }: Props) {
  const { t } = useTranslation()
  const { asPath } = useRouter()
  const [status, copyUrl] = useCopyToClipboard(baseUrl + asPath, 1000)
  const active = status === 'copied' ? 'inherit' : 'primary'
  const [page, setPage] = useState<number>(0)
  const pageSize = 5

  const {
    id: campaignId,
    targetAmount: target,
    summary,
    currency,
    allowDonationOnComplete,
    state: campaignState,
    slug: campaignSlug,
  } = campaign

  const reached = summary?.reachedAmount ?? 0
  const donors = summary?.donors ?? 0
  const {
    data: { items: donations, total: all_rows } = { items: [] },
    error: donationHistoryError,
    isLoading: isDonationHistoryLoading,
  } = useCampaignDonationHistory(campaignId, page, pageSize)
  const { mobile } = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const rowCount = page * pageSize + donations.length
  const detailsShown = isOpen || !mobile

  const [anchorEl, setAnchorEl] = useState<Element | null>(null)

  const handleMenu = (event: React.MouseEvent) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <StyledGrid item xs={12} mt={5} p={3} className={classes.inlineDonationWrapper}>
      <Grid mb={2}>
        <Typography component="span" className={classes.reachedMoney}>
          {moneyPublic(reached, currency)}
        </Typography>
        <Typography component="span" className={classes.targetMoney}>
          {' '}
          {t('campaigns:campaign.from')} {moneyPublic(target, currency)}
        </Typography>
      </Grid>
      <CampaignProgress raised={reached} target={target} />
      {detailsShown && (
        <>
          <Grid display="inline-block" m={3} ml={0}>
            <Typography className={classes.donorsSharesCount}>{donors}</Typography>
            <Typography>{t('campaigns:campaign.donors')}</Typography>
          </Grid>
          <Grid display="inline-block" m={3} ml={0}>
            <Typography className={classes.donorsSharesCount}>{0}</Typography>
            <Typography>{t('campaigns:campaign.shares')}</Typography>
          </Grid>
        </>
      )}
      <Grid container gap={2} className={classes.buttonContainer}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ShareIcon />}
          color="secondary"
          onClickCapture={handleMenu}>
          {t('campaigns:cta.share')}
        </Button>
        <Menu
          keepMounted
          id="share"
          anchorEl={anchorEl}
          onClose={handleClose}
          open={Boolean(anchorEl)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}>
          {socialMedia(baseUrl + asPath).map(({ label, icon: Icon, url }) => (
            <CustomListItem
              key={label}
              icon={<Icon />}
              label={label}
              className={classes.dropdownLinkText}
              onClick={() => {
                window.open(url, '_blank')?.focus()
                return false
              }}
            />
          ))}
          <CustomListItem
            className={classes.dropdownLinkText}
            icon={<AddLinkOutlined />}
            label="Копирайте връзка към кампанията"
            onClick={() => {
              AlertStore.show(t('common:alerts.message-copy'), 'success')
              copyUrl()
            }}
            color={active}
          />
        </Menu>
        <Grid item xs={12}>
          <LinkButton
            fullWidth
            href={routes.campaigns.oneTimeDonation(campaignSlug)}
            disabled={campaignState === CampaignState.complete && !allowDonationOnComplete}
            variant="contained"
            color="secondary"
            startIcon={<Favorite color="action" />}>
            {t('common:support')}
          </LinkButton>
        </Grid>
      </Grid>
      {detailsShown &&
        (donationHistoryError ? (
          'Error fetching donation history'
        ) : isDonationHistoryLoading ? (
          <CircularProgress sx={{ display: 'block', margin: `${theme.spacing(3)} auto` }} />
        ) : (
          <>
            <DonorsAndDonations donations={donations} />
            {donations && donations.length !== 0 ? (
              <Grid container justifyContent="flex-end">
                <Typography m={1}>{`${page * pageSize + 1}-${rowCount}  ${t(
                  'campaigns:of',
                )}  ${all_rows}`}</Typography>
                <IconButton
                  aria-label="back"
                  disabled={page == 0}
                  onClick={() => setPage((index) => index - 1)}>
                  <ArrowBackIosIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="next"
                  disabled={rowCount == all_rows}
                  onClick={() => setPage((index) => index + 1)}>
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Grid>
            ) : null}
          </>
        ))}
      {/* <pre>{JSON.stringify(prices, null, 2)}</pre> */}
      {mobile && (
        <Grid textAlign="center">
          <Button variant="text" onClick={() => setIsOpen(!isOpen)} className={classes.openButton}>
            {isOpen ? <ExpandLessIcon fontSize="large" /> : <ExpandMoreIcon fontSize="large" />}
          </Button>
        </Grid>
      )}
    </StyledGrid>
  )
}
