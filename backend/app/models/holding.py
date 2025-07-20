# models/holding.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) 
    client_id = Column(Integer, nullable=True)
    company_name = Column(String, index=True)
    isin = Column(String, unique=True, index=True)
    market_cap = Column(Float)
    sector = Column(String)
    total_quantity = Column(Integer)
    # free_quantity = Column(Integer)
    avg_trading_price = Column(Float)
    ltp = Column(Float)
    invested_value = Column(Float)
    market_value = Column(Float)
    overall_gain_loss = Column(Float)

    # Corrected relationship to match UserModel
    user = relationship("User", back_populates="holdings")

    def __repr__(self):
        return f"<Holding(company_name='{self.company_name}', total_quantity={self.total_quantity}, ltp={self.ltp})>"