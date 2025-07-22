from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    client_id = Column(String, nullable=True)
    company_name = Column(String, index=True)
    isin = Column(String, index=True)
    market_cap = Column(Float, nullable=True)
    sector = Column(String)
    total_quantity = Column(Integer)
    avg_trading_price = Column(Float)
    ltp = Column(Float)
    invested_value = Column(Float)
    market_value = Column(Float)
    overall_gain_loss = Column(Float)
    stcg_quantity = Column(Integer, nullable=True)
    stcg_value = Column(Float, nullable=True)

    # New fields from Angel One API
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    close = Column(Float, nullable=True)
    trade_volume = Column(Integer, nullable=True)
    year_high = Column(Float, nullable=True)
    year_low = Column(Float, nullable=True)
    total_buy_quantity = Column(Integer, nullable=True)
    total_sell_quantity = Column(Integer, nullable=True)

    user = relationship("User", back_populates="holdings")

    def __repr__(self):
        return f"<Holding(company_name='{self.company_name}', isin='{self.isin}', total_quantity={self.total_quantity})>"
